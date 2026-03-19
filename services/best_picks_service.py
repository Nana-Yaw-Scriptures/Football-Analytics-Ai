"""
best_picks_service.py
Generates top 5 most confident predictions per league from upcoming fixtures.
Results are cached for 6 hours to avoid repeated expensive ML calls.
"""
import time
import threading
from datetime import datetime, timezone

_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 21600  # 6 hours

LEAGUES = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'Primeira Liga',
]

TEAM_NAME_MAP = {
    'Bayern München':           'Bayern Munich',
    'Borussia Mönchengladbach': 'Borussia Monchengladbach',
    'FSV Mainz 05':             'Mainz',
    '1. FC Köln':               'Köln',
    '1. FC Heidenheim':         'Heidenheim',
    'Paris Saint Germain':      'Paris Saint-Germain',
    'Stade Brestois 29':        'Brest',
    'Inter':                    'Internazionale',
    'Bayer Leverkusen':         'Bayer 04 Leverkusen',
    'Monchengladbach':          'Borussia Mönchengladbach',
    'GIL Vicente':              'Gil Vicente',
    'Benfica':                  'Sport Lisboa e Benfica',
    'Sporting CP':              'Sporting Clube de Portugal',
    'SC Braga':                 'Sporting Clube de Braga',
}


def _clean_name(name):
    if name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[name]
    cleaned = name
    for suffix in [' FC', ' AFC', ' CF', ' SC', ' AC', ' AS']:
        if cleaned.endswith(suffix):
            cleaned = cleaned[:-len(suffix)].strip()
    for prefix in ['FC ', 'AFC ', 'AC ', 'AS ', 'RC ']:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
    return cleaned


def _get_val(result, key, default=None):
    if isinstance(result, dict):
        return result.get(key, default)
    return getattr(result, key, default)


def _generate_picks(models):
    from services.live_scores_service import get_upcoming_fixtures
    from services.match_service import get_match_prediction
    from pydantic import BaseModel

    class Req(BaseModel):
        home_team: str
        away_team: str
        league: str = 'Premier League'

    try:
        all_fixtures = get_upcoming_fixtures(league=None, days=4)
    except Exception as e:
        print(f'[BestPicks] Fixture fetch error: {e}')
        return {}

    fixtures = [f for f in all_fixtures if f.get('league') in LEAGUES]
    picks_by_league = {lg: [] for lg in LEAGUES}
    total = len(fixtures)
    print(f'[BestPicks] Running predictions for {total} fixtures...')

    for i, fix in enumerate(fixtures):
        home_raw = fix.get('homeTeam', '')
        away_raw = fix.get('awayTeam', '')
        league   = fix.get('league', '')
        home     = _clean_name(home_raw)
        away     = _clean_name(away_raw)

        try:
            req    = Req(home_team=home, away_team=away, league=league)
            result = get_match_prediction(req, models.get('match_predictor'))

            home_win   = _get_val(result, 'home_win', 0) or 0
            away_win   = _get_val(result, 'away_win', 0) or 0
            draw       = _get_val(result, 'draw', 0) or 0
            pred_score = _get_val(result, 'predicted_score', '—') or '—'
            conf_level = _get_val(result, 'confidence_level', 'Medium') or 'Medium'
            home_crest = _get_val(result, 'home_crest', '') or fix.get('homeLogo', '')
            away_crest = _get_val(result, 'away_crest', '') or fix.get('awayLogo', '')

            top_prob = max(home_win, away_win)
            is_home  = home_win >= away_win

            picks_by_league[league].append({
                'homeTeam':   home_raw,
                'awayTeam':   away_raw,
                'homeLogo':   fix.get('homeLogo', ''),
                'awayLogo':   fix.get('awayLogo', ''),
                'homeCrest':  home_crest,
                'awayCrest':  away_crest,
                'date':       fix.get('date', ''),
                'league':     league,
                'venue':      fix.get('venue', ''),
                'topProb':    round(top_prob * 100),
                'homeWin':    round(home_win * 100),
                'draw':       round(draw * 100),
                'awayWin':    round(away_win * 100),
                'winner':     _clean_name(home_raw) if is_home else _clean_name(away_raw),
                'winnerLogo': fix.get('homeLogo') if is_home else fix.get('awayLogo'),
                'isHomeWin':  is_home,
                'score':      pred_score,
                'confidence': conf_level,
            })
            print(f'[BestPicks] {i+1}/{total} OK {home} vs {away} -> {round(top_prob*100)}%')

        except Exception as e:
            print(f'[BestPicks] {i+1}/{total} FAIL {home} vs {away} -> {e}')
            continue

    result_dict = {}
    for lg in LEAGUES:
        sorted_picks = sorted(picks_by_league[lg], key=lambda p: p['topProb'], reverse=True)
        result_dict[lg] = sorted_picks[:5]

    return result_dict


def get_best_picks(models, force_refresh=False):
    with _cache_lock:
        now          = time.time()
        cached       = _cache.get('picks')
        generated_at = _cache.get('generated_at', 0)

        if cached and not force_refresh and (now - generated_at) < CACHE_TTL:
            return {
                'picks':        cached,
                'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                'cached':       True,
            }

        def _bg():
            try:
                picks = _generate_picks(models)
                with _cache_lock:
                    _cache['picks']        = picks
                    _cache['generated_at'] = time.time()
                print('[BestPicks] Cache updated successfully.')
            except Exception as e:
                print(f'[BestPicks] Background generation error: {e}')

        thread = threading.Thread(target=_bg, daemon=True)
        thread.start()

        if cached:
            return {
                'picks':        cached,
                'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                'cached':       True,
                'regenerating': True,
            }

        thread.join(timeout=120)
        cached       = _cache.get('picks', {})
        generated_at = _cache.get('generated_at', time.time())
        return {
            'picks':        cached,
            'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
            'cached':       False,
        }
"""
best_picks_service.py
Generates top 15 most confident predictions across all 6 leagues.
Only predictions above MIN_CONFIDENCE are included.
Results are cached for 6 hours.
"""
import time
import threading
from datetime import datetime, timezone

_cache      = {}
_cache_lock = threading.Lock()
CACHE_TTL   = 21600   # 6 hours

MIN_CONFIDENCE = 55   # Only show predictions where top prob >= 55%
MAX_PICKS      = 15   # Return at most 15 picks total

LEAGUES = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'Primeira Liga',
]

TEAM_NAME_MAP = {
    'Bayern München':            'Bayern Munich',
    'Borussia Mönchengladbach':  'Borussia Monchengladbach',
    'FSV Mainz 05':              'Mainz',
    '1. FC Köln':                'Köln',
    '1. FC Heidenheim':          'Heidenheim',
    'Paris Saint Germain':       'Paris Saint-Germain',
    'Stade Brestois 29':         'Brest',
    'Inter':                     'Internazionale',
    'Bayer Leverkusen':          'Bayer 04 Leverkusen',
    'GIL Vicente':               'Gil Vicente',
    'Benfica':                   'Sport Lisboa e Benfica',
    'Sporting CP':               'Sporting Clube de Portugal',
    'SC Braga':                  'Sporting Clube de Braga',
    'Internazionale':            'FC Internazionale Milano',
    'AC Milan':                  'AC Milan',
}

LEAGUE_NAME_MAP = {
    'Liga NOS':         'Primeira Liga',
    'Primeira Liga':    'Primeira Liga',
    'Premier League':   'Premier League',
    'La Liga':          'La Liga',
    'Bundesliga':       'Bundesliga',
    'Serie A':          'Serie A',
    'Ligue 1':          'Ligue 1',
    'Champions League': None,
    'UCL':              None,
}


def _clean_name(name: str) -> str:
    if name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[name]
    cleaned = name
    for suffix in [' FC', ' AFC', ' CF', ' SC', ' AC', ' AS', ' SS']:
        if cleaned.upper().endswith(suffix.upper()):
            cleaned = cleaned[:len(cleaned)-len(suffix)].strip()
    for prefix in ['FC ', 'AFC ', 'AC ', 'AS ', 'RC ']:
        if cleaned.upper().startswith(prefix.upper()):
            cleaned = cleaned[len(prefix):].strip()
    return cleaned


def _get_val(result, key, default=None):
    if isinstance(result, dict):
        return result.get(key, default)
    return getattr(result, key, default)


def _generate_picks(models: dict) -> dict:
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

    valid_fixtures = []
    for f in all_fixtures:
        raw_league    = f.get('league', '')
        mapped_league = LEAGUE_NAME_MAP.get(raw_league)
        if mapped_league:
            f['league'] = mapped_league
            valid_fixtures.append(f)

    total = len(valid_fixtures)
    print(f'[BestPicks] Running predictions for {total} fixtures across 6 leagues...')

    all_picks = []

    for i, fix in enumerate(valid_fixtures):
        home_raw = fix.get('homeTeam', '')
        away_raw = fix.get('awayTeam', '')
        league   = fix.get('league', '')
        home     = _clean_name(home_raw)
        away     = _clean_name(away_raw)

        try:
            req    = Req(home_team=home, away_team=away, league=league)
            result = get_match_prediction(req, models.get('match_predictor'))

            home_win   = float(_get_val(result, 'home_win', 0) or 0)
            away_win   = float(_get_val(result, 'away_win', 0) or 0)
            draw       = float(_get_val(result, 'draw', 0) or 0)
            pred_score = str(_get_val(result, 'predicted_score', '—') or '—')
            conf_level = str(_get_val(result, 'confidence_level', 'Medium') or 'Medium')
            home_crest = str(_get_val(result, 'home_crest', '') or fix.get('homeLogo', ''))
            away_crest = str(_get_val(result, 'away_crest', '') or fix.get('awayLogo', ''))

            top_prob = float(max(home_win, away_win))
            is_home  = bool(home_win >= away_win)
            top_pct  = int(round(top_prob * 100))

            if top_pct < MIN_CONFIDENCE:
                print(f'[BestPicks] {i+1}/{total} SKIP {home} vs {away} -> {top_pct}%')
                continue

            all_picks.append({
                'homeTeam':   str(home_raw),
                'awayTeam':   str(away_raw),
                'homeLogo':   str(fix.get('homeLogo', '')),
                'awayLogo':   str(fix.get('awayLogo', '')),
                'homeCrest':  home_crest,
                'awayCrest':  away_crest,
                'date':       str(fix.get('date', '')),
                'league':     str(league),
                'venue':      str(fix.get('venue', '') or ''),
                'topProb':    top_pct,
                'homeWin':    int(round(home_win * 100)),
                'draw':       int(round(draw * 100)),
                'awayWin':    int(round(away_win * 100)),
                'winner':     str(_clean_name(home_raw) if is_home else _clean_name(away_raw)),
                'winnerLogo': str(fix.get('homeLogo', '') if is_home else fix.get('awayLogo', '')),
                'isHomeWin':  bool(is_home),
                'score':      pred_score,
                'confidence': conf_level,
            })
            print(f'[BestPicks] {i+1}/{total} OK {home} vs {away} -> {top_pct}%')

        except Exception as e:
            print(f'[BestPicks] {i+1}/{total} FAIL {home} vs {away} -> {e}')
            continue

    # Sort by confidence descending, take top 15
    all_picks.sort(key=lambda p: p['topProb'], reverse=True)
    top_picks = all_picks[:MAX_PICKS]

    print(f'[BestPicks] Final: {len(top_picks)} picks from {len(all_picks)} qualifying predictions')

    # Group by league for display
    by_league = {lg: [] for lg in LEAGUES}
    for pick in top_picks:
        lg = pick.get('league', '')
        if lg in by_league:
            by_league[lg].append(pick)

    return by_league


def get_best_picks(models: dict, force_refresh: bool = False) -> dict:
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
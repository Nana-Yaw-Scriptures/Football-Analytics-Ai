"""
best_picks_service.py
Generates top 5 most confident predictions per league from upcoming fixtures.
Results are cached for 6 hours to avoid repeated expensive ML calls.
"""
import os
import json
import time
import threading
from datetime import datetime, timezone

_cache = {}          # { 'picks': [...], 'generated_at': timestamp }
_cache_lock = threading.Lock()
CACHE_TTL = 21600    # 6 hours

LEAGUES = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'Primeira Liga',
]

TEAM_NAME_MAP = {
    # API-Football name  →  standings name (what find_team_any_league expects)
    'Bayern München':           'Bayern Munich',
    'Borussia Mönchengladbach': 'Monchengladbach',
    'FSV Mainz 05':             'Mainz',
    '1. FC Köln':               'Köln',
    '1. FC Heidenheim':         'Heidenheim',
    'Paris Saint Germain':      'Paris Saint-Germain',
    'Stade Brestois 29':        'Brest',
    'Inter':                    'Internazionale',
    'Atletico Madrid':          'Atletico Madrid',
    'Sporting CP':              'Sporting CP',
    'AC Milan':                 'AC Milan',
    'AS Roma':                  'Roma',
    'GIL Vicente':              'Gil Vicente',
    'Guimaraes':                'Vitoria SC',
    'Benfica':                  'Sport Lisboa e Benfica',
    'Sporting CP':              'Sporting Clube de Portugal',
    'SC Braga':                 'Sporting Clube de Braga',
    'FC Porto':                 'FC Porto',
}

def _clean_name(name: str) -> str:
    """Map API-Football team name to a name the prediction engine can find."""
    if name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[name]
    cleaned = name
    for suffix in [' FC', ' AFC', ' CF', ' SC', ' AC', ' AS', ' SS']:
        if cleaned.endswith(suffix):
            cleaned = cleaned[:-len(suffix)].strip()
    for prefix in ['FC ', 'AFC ', 'AC ', 'AS ', 'RC ']:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
    return cleaned


def _generate_picks(models: dict) -> dict:
    """
    Fetch upcoming fixtures, run predictions, return top 5 per league.
    This runs in a background thread on first request.
    """
    from services.live_scores_service import get_upcoming_fixtures
    from services.match_service import get_match_prediction
    from pydantic import BaseModel

    class Req(BaseModel):
        home_team: str
        away_team: str
        league: str = 'Premier League'

    # Fetch next 4 days of fixtures
    try:
        all_fixtures = get_upcoming_fixtures(league=None, days=4)
    except Exception as e:
        print(f'[BestPicks] Fixture fetch error: {e}')
        return {}

    # Filter to known leagues only (exclude UCL)
    fixtures = [f for f in all_fixtures if f.get('league') in LEAGUES]

    picks_by_league = {lg: [] for lg in LEAGUES}
    total = len(fixtures)
    print(f'[BestPicks] Running predictions for {total} fixtures…')

    for i, fix in enumerate(fixtures):
        home_raw = fix.get('homeTeam', '')
        away_raw = fix.get('awayTeam', '')
        league   = fix.get('league', '')
        home     = _clean_name(home_raw)
        away     = _clean_name(away_raw)

        try:
            req    = Req(home_team=home, away_team=away, league=league)
            result = get_match_prediction(req, models.get('match_predictor'))

            home_win = result.home_win or 0
            away_win = result.away_win or 0
            draw     = result.draw or 0
            top_prob = max(home_win, away_win)
            is_home  = home_win >= away_win

            picks_by_league[league].append({
                'homeTeam':   home_raw,
                'awayTeam':   away_raw,
                'homeLogo':   fix.get('homeLogo', ''),
                'awayLogo':   fix.get('awayLogo', ''),
                'homeCrest':  result.home_crest or fix.get('homeLogo', ''),
                'awayCrest':  result.away_crest or fix.get('awayLogo', ''),
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
                'score':      result.predicted_score or '—',
                'confidence': result.confidence_level or 'Medium',
            })
            print(f'[BestPicks] {i+1}/{total} ✓ {home} vs {away} → {round(top_prob*100)}%')
        except Exception as e:
            print(f'[BestPicks] {i+1}/{total} ✗ {home} vs {away} → {e}')
            continue

    # Sort each league by topProb, take top 5
    result_dict = {}
    for lg in LEAGUES:
        sorted_picks = sorted(picks_by_league[lg], key=lambda p: p['topProb'], reverse=True)
        result_dict[lg] = sorted_picks[:5]

    return result_dict


def get_best_picks(models: dict, force_refresh: bool = False) -> dict:
    """
    Returns cached picks or generates fresh ones.
    On first call, returns empty dict and starts background generation.
    """
    with _cache_lock:
        now = time.time()
        cached = _cache.get('picks')
        generated_at = _cache.get('generated_at', 0)

        # Return cache if valid and not forcing refresh
        if cached and not force_refresh and (now - generated_at) < CACHE_TTL:
            return {
                'picks':        cached,
                'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                'cached':       True,
            }

        # Start background generation
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

        # If we have stale cache, return it while regenerating
        if cached:
            return {
                'picks':        cached,
                'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                'cached':       True,
                'regenerating': True,
            }

        # No cache at all — wait for first generation (up to 120s)
        thread.join(timeout=120)
        cached = _cache.get('picks', {})
        generated_at = _cache.get('generated_at', time.time())
        return {
            'picks':        cached,
            'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
            'cached':       False,
        }
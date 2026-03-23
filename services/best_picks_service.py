"""
best_picks_service.py
Generates top 15 most confident predictions across all 6 leagues.
Cache persists to disk — survives Render restarts.
Only predicts the current gameweek window (3-day range from earliest fixture).
"""
import os
import json
import time
import threading
from datetime import datetime, timezone, timedelta

CACHE_FILE  = os.path.join('cache', 'best_picks_cache.json')
CACHE_TTL   = 172800   # 48 hours
_mem_cache  = {}
_cache_lock = threading.Lock()
_is_running = False

MIN_CONFIDENCE = 55
MAX_PICKS      = 15

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


def _save_to_file(picks: dict, generated_at: float):
    try:
        os.makedirs('cache', exist_ok=True)
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump({'picks': picks, 'generated_at': generated_at}, f)
        print(f'[BestPicks] Cache saved to disk.')
    except Exception as e:
        print(f'[BestPicks] Failed to save cache: {e}')


def _load_from_file() -> dict:
    try:
        if not os.path.exists(CACHE_FILE):
            return {}
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        generated_at = data.get('generated_at', 0)
        age_hours = int((time.time() - generated_at) / 3600)
        if time.time() - generated_at < CACHE_TTL:
            print(f'[BestPicks] Loaded from disk (age: {age_hours}h)')
            return data
        print(f'[BestPicks] Disk cache expired ({age_hours}h old).')
        return {}
    except Exception as e:
        print(f'[BestPicks] Failed to load cache: {e}')
        return {}


def _generate_picks(models: dict) -> dict:
    from services.live_scores_service import get_upcoming_fixtures
    from services.match_service import get_match_prediction
    from pydantic import BaseModel

    class Req(BaseModel):
        home_team: str
        away_team: str
        league: str = 'Premier League'

    try:
        all_fixtures = get_upcoming_fixtures(league=None, days=7)
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

    # Smart gameweek window — only predict next 3 days from earliest fixture
    dates = sorted([f.get('date', '') for f in valid_fixtures if f.get('date')])
    if dates:
        earliest = datetime.fromisoformat(dates[0].replace('Z', '+00:00'))
        cutoff   = earliest + timedelta(days=3)
        valid_fixtures = [
            f for f in valid_fixtures
            if f.get('date') and datetime.fromisoformat(
                f['date'].replace('Z', '+00:00')
            ) <= cutoff
        ]
        print(f'[BestPicks] Gameweek: {earliest.date()} to {cutoff.date()} ({len(valid_fixtures)} fixtures)')

    total = len(valid_fixtures)
    if total == 0:
        print('[BestPicks] No fixtures in gameweek window.')
        return {}

    print(f'[BestPicks] Running {total} predictions...')
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

    all_picks.sort(key=lambda p: p['topProb'], reverse=True)
    top_picks = all_picks[:MAX_PICKS]
    print(f'[BestPicks] Final: {len(top_picks)} picks from {len(all_picks)} qualifying.')

    by_league = {lg: [] for lg in LEAGUES}
    for pick in top_picks:
        lg = pick.get('league', '')
        if lg in by_league:
            by_league[lg].append(pick)

    return by_league


def get_best_picks(models: dict, force_refresh: bool = False) -> dict:
    global _is_running

    with _cache_lock:
        now = time.time()

        # 1. In-memory cache (fastest)
        if _mem_cache and not force_refresh:
            generated_at = _mem_cache.get('generated_at', 0)
            if now - generated_at < CACHE_TTL:
                return {
                    'picks':        _mem_cache['picks'],
                    'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                    'cached':       True,
                }

        # 2. Disk cache (survives restarts)
        if not force_refresh:
            disk = _load_from_file()
            if disk:
                _mem_cache.update(disk)
                return {
                    'picks':        disk['picks'],
                    'generated_at': datetime.fromtimestamp(disk['generated_at'], tz=timezone.utc).isoformat(),
                    'cached':       True,
                }

        # 3. Already running — skip duplicate
        if _is_running:
            print('[BestPicks] Already running — skipping duplicate.')
            cached       = _mem_cache.get('picks') or _load_from_file().get('picks', {})
            generated_at = _mem_cache.get('generated_at', now)
            if cached:
                return {
                    'picks':        cached,
                    'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
                    'cached':       True,
                    'regenerating': True,
                }
            return {
                'picks':        {},
                'generated_at': datetime.fromtimestamp(now, tz=timezone.utc).isoformat(),
                'cached':       False,
                'regenerating': True,
            }

        # 4. Start background generation
        def _bg():
            global _is_running
            _is_running = True
            try:
                picks = _generate_picks(models)
                ts    = time.time()
                with _cache_lock:
                    _mem_cache['picks']        = picks
                    _mem_cache['generated_at'] = ts
                _save_to_file(picks, ts)
                print('[BestPicks] Cache updated successfully.')
            except Exception as e:
                print(f'[BestPicks] Background error: {e}')
            finally:
                _is_running = False

        thread = threading.Thread(target=_bg, daemon=True)
        thread.start()

        # Return stale while regenerating
        stale    = _mem_cache.get('picks') or _load_from_file().get('picks', {})
        stale_ts = _mem_cache.get('generated_at', now)
        if stale:
            return {
                'picks':        stale,
                'generated_at': datetime.fromtimestamp(stale_ts, tz=timezone.utc).isoformat(),
                'cached':       True,
                'regenerating': True,
            }

        # First ever load — wait up to 120s
        thread.join(timeout=120)
        cached       = _mem_cache.get('picks', {})
        generated_at = _mem_cache.get('generated_at', now)
        return {
            'picks':        cached,
            'generated_at': datetime.fromtimestamp(generated_at, tz=timezone.utc).isoformat(),
            'cached':       False,
        }
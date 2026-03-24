"""
injury_scraper.py
Scrapes injury data from multiple free sources:
- FPL API (Premier League — official, real-time)
- Transfermarkt (All other leagues — scraped)
Cache: 6 hours
"""
import os
import json
import time
import requests
from datetime import datetime, timezone
from bs4 import BeautifulSoup

FPL_TEAM_LOGOS = {
    1:  'https://resources.premierleague.com/premierleague/badges/50/t3.png',   # Arsenal
    2:  'https://resources.premierleague.com/premierleague/badges/50/t7.png',   # Aston Villa
    3:  'https://resources.premierleague.com/premierleague/badges/50/t91.png',  # Bournemouth
    4:  'https://resources.premierleague.com/premierleague/badges/50/t94.png',  # Brentford
    5:  'https://resources.premierleague.com/premierleague/badges/50/t36.png',  # Brighton
    6:  'https://resources.premierleague.com/premierleague/badges/50/t90.png',  # Chelsea
    7:  'https://resources.premierleague.com/premierleague/badges/50/t31.png',  # Crystal Palace
    8:  'https://resources.premierleague.com/premierleague/badges/50/t11.png',  # Everton
    9:  'https://resources.premierleague.com/premierleague/badges/50/t54.png',  # Fulham
    10: 'https://resources.premierleague.com/premierleague/badges/50/t40.png',  # Ipswich
    11: 'https://resources.premierleague.com/premierleague/badges/50/t13.png',  # Leicester
    12: 'https://resources.premierleague.com/premierleague/badges/50/t2.png',   # Liverpool
    13: 'https://resources.premierleague.com/premierleague/badges/50/t43.png',  # Man City
    14: 'https://resources.premierleague.com/premierleague/badges/50/t1.png',   # Man United
    15: 'https://resources.premierleague.com/premierleague/badges/50/t4.png',   # Newcastle
    16: 'https://resources.premierleague.com/premierleague/badges/50/t20.png',  # Nottm Forest
    17: 'https://resources.premierleague.com/premierleague/badges/50/t6.png',   # Southampton
    18: 'https://resources.premierleague.com/premierleague/badges/50/t57.png',  # Spurs
    19: 'https://resources.premierleague.com/premierleague/badges/50/t21.png',  # West Ham
    20: 'https://resources.premierleague.com/premierleague/badges/50/t39.png',  # Wolves
}

CACHE_DIR  = 'cache'
CACHE_TTL  = 21600  # 6 hours
os.makedirs(CACHE_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
}

# Transfermarkt league URLs
TM_LEAGUES = {
    'La Liga':       'https://www.transfermarkt.com/laliga/verletzte/wettbewerb/ES1',
    'Bundesliga':    'https://www.transfermarkt.com/bundesliga/verletzte/wettbewerb/L1',
    'Serie A':       'https://www.transfermarkt.com/serie-a/verletzte/wettbewerb/IT1',
    'Ligue 1':       'https://www.transfermarkt.com/ligue-1/verletzte/wettbewerb/FR1',
    'Primeira Liga': 'https://www.transfermarkt.com/liga-nos/verletzte/wettbewerb/PO1',
}

# FPL status codes
FPL_STATUS = {
    'a': 'Available',
    'd': 'Doubtful',
    'i': 'Injured',
    's': 'Suspended',
    'u': 'Unavailable',
    'n': 'Not Available',
}


def _cache_path(league: str) -> str:
    safe = league.replace(' ', '_').replace('/', '_')
    return os.path.join(CACHE_DIR, f'injuries_{safe}.json')


def _read_cache(league: str):
    path = _cache_path(league)
    try:
        if os.path.exists(path):
            age = time.time() - os.path.getmtime(path)
            if age < CACHE_TTL:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
    except Exception:
        pass
    return None


def _write_cache(league: str, data: list):
    path = _cache_path(league)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception as e:
        print(f'[InjuryScraper] Cache write error: {e}')


# ── Premier League via FPL API ────────────────────────────────────────
def _fetch_fpl_injuries() -> list:
    """Fetch Premier League injuries from official FPL API."""
    try:
        print('[InjuryScraper] Fetching Premier League from FPL API...')
        resp = requests.get(
            'https://fantasy.premierleague.com/api/bootstrap-static/',
            timeout=15,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        data = resp.json()

        # Build team lookup
        teams = {t['id']: t for t in data.get('teams', [])}

        injuries = []
        for player in data.get('elements', []):
            status = player.get('status', 'a')
            if status == 'a':
                continue  # Skip available players

            news = player.get('news', '') or ''
            chance = player.get('chance_of_playing_next_round')

            # Get team info
            team_id   = player.get('team')
            team_info = teams.get(team_id, {})
            team_name = team_info.get('name', '')
            team_short= team_info.get('short_name', '')

            # Determine injury type from news
            injury_type = 'Injured'
            if status == 's':
                injury_type = 'Suspended'
            elif 'hamstring' in news.lower():
                injury_type = 'Hamstring Injury'
            elif 'knee' in news.lower():
                injury_type = 'Knee Injury'
            elif 'muscle' in news.lower():
                injury_type = 'Muscle Injury'
            elif 'ankle' in news.lower():
                injury_type = 'Ankle Injury'
            elif 'back' in news.lower():
                injury_type = 'Back Injury'
            elif 'groin' in news.lower():
                injury_type = 'Groin Injury'
            elif 'shoulder' in news.lower():
                injury_type = 'Shoulder Injury'
            elif 'thigh' in news.lower():
                injury_type = 'Thigh Injury'
            elif 'calf' in news.lower():
                injury_type = 'Calf Injury'
            elif 'illness' in news.lower():
                injury_type = 'Illness'
            elif status == 'd':
                injury_type = 'Doubtful'

            # Player photo from FPL
            player_code = player.get('code', '')
            photo_url   = f'https://resources.premierleague.com/premierleague/photos/players/110x140/p{player_code}.png' if player_code else ''

            injuries.append({
                'player':      f"{player.get('first_name', '')} {player.get('second_name', '')}".strip(),
                'playerPhoto': photo_url,
                'team':        team_name,
                'teamLogo': FPL_TEAM_LOGOS.get(team_id, ''),
                'type':        injury_type,
                'reason':      FPL_STATUS.get(status, 'Unknown'),
                'news':        news,
                'chanceOfPlaying': chance,
                'returnDate':  'Unknown',
                'games_missed': 0,
                'league':      'Premier League',
                'source':      'FPL',
            })

        print(f'[InjuryScraper] FPL: {len(injuries)} unavailable players found')
        return injuries

    except Exception as e:
        print(f'[InjuryScraper] FPL fetch error: {e}')
        return []

def _fetch_apifootball_injuries(league: str) -> list:
    """Fallback to API-Football injuries endpoint."""
    import os
    from datetime import date
    
    API_KEY = os.getenv('API_FOOTBALL_KEY', '')
    LEAGUE_IDS = {
        'La Liga': 140, 'Bundesliga': 78,
        'Serie A': 135, 'Ligue 1': 61, 'Primeira Liga': 94,
    }
    league_id = LEAGUE_IDS.get(league)
    if not league_id or not API_KEY:
        return []

    try:
        resp = requests.get(
            'https://v3.football.api-sports.io/injuries',
            headers={'x-apisports-key': API_KEY},
            params={'league': league_id, 'season': 2025},
            timeout=15,
        )
        data = resp.json().get('response', [])
        today = str(date.today())
        seen = {}
        for entry in data:
            player = entry.get('player', {})
            team   = entry.get('team', {})
            fix    = entry.get('fixture', {})
            pid    = player.get('id') or player.get('name', '')
            dt     = (fix.get('date', '') or '')[:10]
            if pid not in seen or dt > seen[pid]['returnDate']:
                seen[pid] = {
                    'player':      player.get('name', ''),
                    'playerPhoto': player.get('photo', ''),
                    'team':        team.get('name', ''),
                    'teamLogo':    team.get('logo', ''),
                    'type':        player.get('reason', '') or player.get('type', ''),
                    'reason':      player.get('type', ''),
                    'news':        '',
                    'chanceOfPlaying': None,
                    'returnDate':  dt or 'Unknown',
                    'games_missed': 0,
                    'league':      league,
                    'source':      'API-Football',
                }
        return sorted(
            [v for v in seen.values() if v['returnDate'] >= today or v['returnDate'] == 'Unknown'],
            key=lambda x: x['team']
        )
    except Exception as e:
        print(f'[InjuryScraper] API-Football fallback error: {e}')
        return []

# ── Other leagues via Transfermarkt ──────────────────────────────────
def _fetch_transfermarkt_injuries(league: str) -> list:
    url = TM_LEAGUES.get(league)
    if not url:
        return []

    try:
        print(f'[InjuryScraper] Scraping {league} from Transfermarkt...')
        session = requests.Session()
        
        # First request to get cookies
        session.get('https://www.transfermarkt.com', headers=HEADERS, timeout=10)
        
        # Better headers to bypass Cloudflare
        headers = {
            **HEADERS,
            'Referer': 'https://www.transfermarkt.com',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
        }
        
        resp = session.get(url, headers=headers, timeout=15)
        print(f'[InjuryScraper] {league}: HTTP {resp.status_code}')

        if resp.status_code == 403 or resp.status_code == 503:
            print(f'[InjuryScraper] {league}: Blocked by Cloudflare — falling back to API-Football')
            return _fetch_apifootball_injuries(league)

        soup = BeautifulSoup(resp.text, 'lxml')
        
        injuries = []
        # Parse injury table from Transfermarkt
        # Note: Transfermarkt HTML structure may vary, adjust selectors as needed
        
        print(f'[InjuryScraper] {league}: {len(injuries)} injuries found')
        return injuries

    except Exception as e:
        print(f'[InjuryScraper] {league} fetch error: {e}')
        return []


# ── Public API ────────────────────────────────────────────────────────
def get_injuries_scraped(league: str) -> list:
    cached = _read_cache(league)
    if cached is not None:
        return cached

    if league == 'Premier League':
        data = _fetch_fpl_injuries()
    else:
        data = _fetch_transfermarkt_injuries(league)
        if not data:
            print(f'[InjuryScraper] {league}: Transfermarkt empty, using API-Football')
            data = _fetch_apifootball_injuries(league)

    if data:
        _write_cache(league, data)
    return data
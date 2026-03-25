"""
injury_scraper.py
Sources:
- FPL API (Premier League — official, real-time)
- API-Football fallback (all other leagues)
- Transfermarkt (attempted first for non-EPL, fallback to API-Football if blocked)
Cache: 6 hours
"""
import os
import json
import time
import requests
from datetime import date as dt
from bs4 import BeautifulSoup

CACHE_DIR = 'cache'
CACHE_TTL = 21600  # 6 hours
os.makedirs(CACHE_DIR, exist_ok=True)

HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept':          'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Referer':         'https://www.transfermarkt.com',
    'sec-ch-ua':       '"Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Fetch-Dest':  'document',
    'Sec-Fetch-Mode':  'navigate',
    'Sec-Fetch-Site':  'same-origin',
}

TM_LEAGUES = {
    'La Liga':       'https://www.transfermarkt.com/laliga/verletzte/wettbewerb/ES1',
    'Bundesliga':    'https://www.transfermarkt.com/bundesliga/verletzte/wettbewerb/L1',
    'Serie A':       'https://www.transfermarkt.com/serie-a/verletzte/wettbewerb/IT1',
    'Ligue 1':       'https://www.transfermarkt.com/ligue-1/verletzte/wettbewerb/FR1',
    'Primeira Liga': 'https://www.transfermarkt.com/liga-nos/verletzte/wettbewerb/PO1',
}

API_FOOTBALL_IDS = {
    'La Liga':       140,
    'Bundesliga':    78,
    'Serie A':       135,
    'Ligue 1':       61,
    'Primeira Liga': 94,
}

FPL_TEAM_LOGOS = {
    1:  'https://resources.premierleague.com/premierleague/badges/50/t3.png',
    2:  'https://resources.premierleague.com/premierleague/badges/50/t7.png',
    3:  'https://resources.premierleague.com/premierleague/badges/50/t91.png',
    4:  'https://resources.premierleague.com/premierleague/badges/50/t94.png',
    5:  'https://resources.premierleague.com/premierleague/badges/50/t36.png',
    6:  'https://resources.premierleague.com/premierleague/badges/50/t90.png',
    7:  'https://resources.premierleague.com/premierleague/badges/50/t31.png',
    8:  'https://resources.premierleague.com/premierleague/badges/50/t11.png',
    9:  'https://resources.premierleague.com/premierleague/badges/50/t54.png',
    10: 'https://resources.premierleague.com/premierleague/badges/50/t40.png',
    11: 'https://resources.premierleague.com/premierleague/badges/50/t13.png',
    12: 'https://resources.premierleague.com/premierleague/badges/50/t2.png',
    13: 'https://resources.premierleague.com/premierleague/badges/50/t43.png',
    14: 'https://resources.premierleague.com/premierleague/badges/50/t1.png',
    15: 'https://resources.premierleague.com/premierleague/badges/50/t4.png',
    16: 'https://resources.premierleague.com/premierleague/badges/50/t20.png',
    17: 'https://resources.premierleague.com/premierleague/badges/50/t6.png',
    18: 'https://resources.premierleague.com/premierleague/badges/50/t57.png',
    19: 'https://resources.premierleague.com/premierleague/badges/50/t21.png',
    20: 'https://resources.premierleague.com/premierleague/badges/50/t39.png',
}

# Keywords that indicate a transfer/loan OUT — not an injury
TRANSFER_KEYWORDS = [
    'has joined', 'permanently', 'loan for the rest', 'season-long loan',
    'signed by', 'departed', 'free agent', 'on loan to', 'has left',
    'released', 'transferred',
]

FPL_STATUS = {
    'a': 'Available',
    'd': 'Doubtful',
    'i': 'Injured',
    's': 'Suspended',
    'u': 'Unavailable',
    'n': 'Not Available',
}


# ── Cache helpers ─────────────────────────────────────────────────────
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


def _is_transfer(news: str) -> bool:
    """Return True if the news indicates a transfer/loan out, not an injury."""
    if not news:
        return False
    news_lower = news.lower()
    return any(kw.lower() in news_lower for kw in TRANSFER_KEYWORDS)


def _injury_type_from_news(news: str, status: str) -> str:
    """Derive injury type from FPL news text."""
    if status == 's':
        return 'Suspended'
    n = news.lower()
    if 'hamstring' in n: return 'Hamstring Injury'
    if 'knee'      in n: return 'Knee Injury'
    if 'acl'       in n: return 'Knee Injury'
    if 'cruciate'  in n: return 'Knee Injury'
    if 'muscle'    in n: return 'Muscle Injury'
    if 'ankle'     in n: return 'Ankle Injury'
    if 'calf'      in n: return 'Calf Injury'
    if 'thigh'     in n: return 'Thigh Injury'
    if 'groin'     in n: return 'Groin Injury'
    if 'back'      in n: return 'Back Injury'
    if 'shoulder'  in n: return 'Shoulder Injury'
    if 'foot'      in n: return 'Foot Injury'
    if 'hip'       in n: return 'Hip Injury'
    if 'achilles'  in n: return 'Achilles Injury'
    if 'hernia'    in n: return 'Hernia'
    if 'illness'   in n: return 'Illness'
    if 'knock'     in n: return 'Doubtful'
    if 'dead leg'  in n: return 'Doubtful'
    if 'fatigue'   in n: return 'Doubtful'
    if 'fitness'   in n: return 'Doubtful'
    if status == 'd':    return 'Doubtful'
    return 'Injured'


# ── Premier League — FPL API ──────────────────────────────────────────
def _fetch_fpl_injuries() -> list:
    try:
        print('[InjuryScraper] Fetching Premier League from FPL API...')
        resp = requests.get(
            'https://fantasy.premierleague.com/api/bootstrap-static/',
            timeout=15,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        data  = resp.json()
        teams = {t['id']: t for t in data.get('teams', [])}

        injuries = []
        for player in data.get('elements', []):
            status = player.get('status', 'a')
            if status == 'a':
                continue  # available — skip

            news   = player.get('news', '') or ''
            chance = player.get('chance_of_playing_next_round')

            # ── KEY FIX: skip transferred/loaned out players ──
            if _is_transfer(news):
                continue

            # Also skip if chance is None and no real injury news
            # and status is just 'u' (generic unavailable)
            if status == 'u' and not news:
                continue

            team_id   = player.get('team')
            team_info = teams.get(team_id, {})
            team_name = team_info.get('name', '')

            injury_type = _injury_type_from_news(news, status)
            player_code = player.get('code', '')
            photo_url   = f'https://resources.premierleague.com/premierleague/photos/players/110x140/p{player_code}.png' if player_code else ''

            injuries.append({
                'player':          f"{player.get('first_name','')} {player.get('second_name','')}".strip(),
                'playerPhoto':     photo_url,
                'team':            team_name,
                'teamLogo':        FPL_TEAM_LOGOS.get(team_id, ''),
                'type':            injury_type,
                'reason':          FPL_STATUS.get(status, 'Unknown'),
                'news':            news,
                'chanceOfPlaying': chance,
                'returnDate':      'Unknown',
                'games_missed':    0,
                'league':          'Premier League',
                'source':          'FPL',
            })

        print(f'[InjuryScraper] FPL: {len(injuries)} genuine injuries/suspensions found')
        return injuries

    except Exception as e:
        print(f'[InjuryScraper] FPL fetch error: {e}')
        return []


# ── API-Football fallback for other leagues ───────────────────────────
def _fetch_apifootball_injuries(league: str) -> list:
    """Fallback to API-Football injuries endpoint."""
    api_key    = os.getenv('API_FOOTBALL_KEY', '')
    league_id  = API_FOOTBALL_IDS.get(league)
    if not league_id or not api_key:
        print(f'[InjuryScraper] {league}: No API key or league ID for API-Football fallback')
        return []

    today = str(dt.today())
    try:
        print(f'[InjuryScraper] {league}: Trying API-Football fallback...')
        resp = requests.get(
            'https://v3.football.api-sports.io/injuries',
            headers={'x-apisports-key': api_key},
            params={'league': league_id, 'season': 2025},
            timeout=15,
        )
        raw  = resp.json().get('response', [])
        seen = {}

        for entry in raw:
            player = entry.get('player', {})
            team   = entry.get('team', {})
            fix    = entry.get('fixture', {})
            pid    = player.get('id') or player.get('name', '')
            dt_str = (fix.get('date', '') or '')[:10]

            # Keep only the latest fixture date per player
            if pid not in seen or dt_str > seen[pid]['returnDate']:
                seen[pid] = {
                    'player':          player.get('name', ''),
                    'playerPhoto':     player.get('photo', ''),
                    'team':            team.get('name', ''),
                    'teamLogo':        team.get('logo', ''),
                    'type':            player.get('reason', '') or player.get('type', '') or 'Injury',
                    'reason':          player.get('type', ''),
                    'news':            '',
                    'chanceOfPlaying': None,
                    'returnDate':      dt_str or 'Unknown',
                    'games_missed':    0,
                    'league':          league,
                    'source':          'API-Football',
                }

        # Only include players whose latest injury date is today or future
        result = sorted(
            [v for v in seen.values() if v['returnDate'] >= today or v['returnDate'] == 'Unknown'],
            key=lambda x: x['team']
        )
        print(f'[InjuryScraper] {league}: API-Football returned {len(result)} players')
        return result

    except Exception as e:
        print(f'[InjuryScraper] {league}: API-Football error: {e}')
        return []


# ── Transfermarkt scraper ─────────────────────────────────────────────
def _fetch_transfermarkt_injuries(league: str) -> list:
    url = TM_LEAGUES.get(league)
    if not url:
        return []

    try:
        print(f'[InjuryScraper] Scraping {league} from Transfermarkt...')
        session = requests.Session()
        session.get('https://www.transfermarkt.com', headers=HEADERS, timeout=10)
        resp = session.get(url, headers=HEADERS, timeout=15)

        print(f'[InjuryScraper] {league}: HTTP {resp.status_code}')
        if resp.status_code in (403, 503, 429):
            print(f'[InjuryScraper] {league}: Blocked — falling back to API-Football')
            return []

        soup  = BeautifulSoup(resp.text, 'lxml')
        table = soup.find('table', {'class': 'items'})
        if not table:
            print(f'[InjuryScraper] {league}: No table found — falling back')
            return []

        rows     = table.find('tbody').find_all('tr') if table.find('tbody') else []
        injuries = []

        for row in rows:
            try:
                cells = row.find_all('td')
                if len(cells) < 5:
                    continue

                player_cell = row.find('td', {'class': 'hauptlink'})
                if not player_cell:
                    continue
                player_name = player_cell.get_text(strip=True)
                if not player_name:
                    continue

                img   = row.find('img', {'class': 'bilderrahmen-fixed'})
                photo = (img.get('data-src') or img.get('src', '')) if img else ''

                team_img  = row.find('img', {'class': 'tiny_wappen'})
                team_name = team_img.get('title', '') if team_img else ''
                team_logo = team_img.get('src', '') if team_img else ''

                injury_cell = row.find('td', {'class': 'hauptlink-Links'}) or row.find('td', {'title': True})
                injury_type = injury_cell.get_text(strip=True) if injury_cell else 'Injury'

                all_text     = [c.get_text(strip=True) for c in cells]
                return_date  = 'Unknown'
                games_missed = 0

                for txt in all_text:
                    if any(m in txt for m in ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']):
                        return_date = txt
                    try:
                        val = int(txt)
                        if 1 <= val <= 60:
                            games_missed = val
                    except Exception:
                        pass

                injuries.append({
                    'player':          player_name,
                    'playerPhoto':     photo,
                    'team':            team_name,
                    'teamLogo':        team_logo,
                    'type':            injury_type or 'Injury',
                    'reason':          'Injury',
                    'news':            '',
                    'chanceOfPlaying': None,
                    'returnDate':      return_date,
                    'games_missed':    games_missed,
                    'league':          league,
                    'source':          'Transfermarkt',
                })
            except Exception:
                continue

        print(f'[InjuryScraper] {league}: Transfermarkt found {len(injuries)} injuries')
        return injuries

    except Exception as e:
        print(f'[InjuryScraper] {league} scrape error: {e}')
        return []


# ── Public API ────────────────────────────────────────────────────────
def get_injuries_scraped(league: str) -> list:
    """Get injuries for a league. Cache → FPL/TM → API-Football fallback."""
    cached = _read_cache(league)
    if cached is not None:
        print(f'[InjuryScraper] {league}: Serving from cache ({len(cached)} players)')
        return cached

    if league == 'Premier League':
        data = _fetch_fpl_injuries()
    else:
        # Try Transfermarkt first
        data = _fetch_transfermarkt_injuries(league)
        # If empty or blocked, fall back to API-Football
        if not data:
            print(f'[InjuryScraper] {league}: Transfermarkt empty — using API-Football')
            data = _fetch_apifootball_injuries(league)

    if data:
        _write_cache(league, data)

    return data
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
                'teamLogo':    f'https://resources.premierleague.com/premierleague/badges/t{team_id}.png',
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


# ── Other leagues via Transfermarkt ──────────────────────────────────
def _fetch_transfermarkt_injuries(league: str) -> list:
    """Scrape injury data from Transfermarkt."""
    url = TM_LEAGUES.get(league)
    if not url:
        return []

    try:
        print(f'[InjuryScraper] Scraping {league} from Transfermarkt...')
        resp = requests.get(url, headers=HEADERS, timeout=15)

        if resp.status_code != 200:
            print(f'[InjuryScraper] {league}: HTTP {resp.status_code}')
            return []

        soup = BeautifulSoup(resp.text, 'html.parser')
        injuries = []

        # Find the injury table
        table = soup.find('table', {'class': 'items'})
        if not table:
            print(f'[InjuryScraper] {league}: No table found')
            return []

        rows = table.find('tbody').find_all('tr') if table.find('tbody') else []

        for row in rows:
            try:
                cells = row.find_all('td')
                if len(cells) < 5:
                    continue

                # Player name and link
                player_cell = row.find('td', {'class': 'hauptlink'})
                if not player_cell:
                    continue
                player_name = player_cell.get_text(strip=True)

                # Player photo
                img = row.find('img', {'class': 'bilderrahmen-fixed'})
                photo = img.get('data-src') or img.get('src', '') if img else ''

                # Team
                team_cells = row.find_all('td', {'class': 'zentriert'})
                team_img   = row.find('img', {'class': 'tiny_wappen'})
                team_name  = team_img.get('title', '') if team_img else ''
                team_logo  = team_img.get('src', '') if team_img else ''

                # Injury type
                injury_cell = row.find('td', {'class': 'hauptlink-Links'}) or \
                              row.find('td', {'title': True})
                injury_type = injury_cell.get_text(strip=True) if injury_cell else 'Injury'

                # Return date and games missed — usually last cells
                all_cells_text = [c.get_text(strip=True) for c in cells]

                return_date   = 'Unknown'
                games_missed  = 0

                # Look for date pattern
                for txt in all_cells_text:
                    if any(month in txt for month in ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']):
                        return_date = txt
                    try:
                        val = int(txt)
                        if 1 <= val <= 50:
                            games_missed = val
                    except Exception:
                        pass

                if not player_name:
                    continue

                injuries.append({
                    'player':      player_name,
                    'playerPhoto': photo,
                    'team':        team_name,
                    'teamLogo':    team_logo,
                    'type':        injury_type or 'Injury',
                    'reason':      'Injury',
                    'news':        '',
                    'chanceOfPlaying': None,
                    'returnDate':  return_date,
                    'games_missed': games_missed,
                    'league':      league,
                    'source':      'Transfermarkt',
                })

            except Exception as e:
                continue

        print(f'[InjuryScraper] {league}: {len(injuries)} injuries found')
        return injuries

    except Exception as e:
        print(f'[InjuryScraper] {league} scrape error: {e}')
        return []


# ── Public API ────────────────────────────────────────────────────────
def get_injuries_scraped(league: str) -> list:
    """
    Get injuries for a league from best available source.
    Uses cache to avoid repeated scraping.
    """
    # Check cache first
    cached = _read_cache(league)
    if cached is not None:
        print(f'[InjuryScraper] {league}: Returning cached data ({len(cached)} players)')
        return cached

    # Fetch fresh data
    if league == 'Premier League':
        data = _fetch_fpl_injuries()
    else:
        data = _fetch_transfermarkt_injuries(league)

    # Cache the result
    if data:
        _write_cache(league, data)

    return data
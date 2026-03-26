"""
injury_scraper.py
Sources:
- FPL API (Premier League)
- Transfermarkt (other leagues, injuries + suspensions)
- TheFishy.net (fallback)
- API-Football (last resort)
"""
import os, json, time, requests
from datetime import date as dt
from bs4 import BeautifulSoup

CACHE_DIR = 'cache'
CACHE_TTL = 21600
os.makedirs(CACHE_DIR, exist_ok=True)

HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept':          'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Referer':         'https://www.transfermarkt.com',
}

TM_LEAGUES = {
    'La Liga':       'https://www.transfermarkt.com/laliga/verletztespieler/wettbewerb/ES1',
    'Bundesliga':    'https://www.transfermarkt.com/bundesliga/verletztespieler/wettbewerb/L1',
    'Serie A':       'https://www.transfermarkt.com/serie-a/verletztespieler/wettbewerb/IT1',
    'Ligue 1':       'https://www.transfermarkt.com/ligue-1/verletztespieler/wettbewerb/FR1',
    'Primeira Liga': 'https://www.transfermarkt.com/liga-nos/verletztespieler/wettbewerb/PO1',
}

FISHY_LEAGUES = {
    'La Liga':       '4',
    'Bundesliga':    '32',
    'Serie A':       '2',
    'Ligue 1':       '16',
    'Primeira Liga': '34',
}

API_FOOTBALL_IDS = {
    'La Liga': 140, 'Bundesliga': 78, 'Serie A': 135,
    'Ligue 1': 61,  'Primeira Liga': 94,
}

TRANSFER_KEYWORDS = [
    'has joined', 'permanently', 'loan for the rest', 'season-long loan',
    'signed by', 'departed', 'free agent', 'on loan to', 'has left',
    'released', 'transferred',
]

FPL_STATUS = {'a':'Available','d':'Doubtful','i':'Injured','s':'Suspended','u':'Unavailable','n':'Not Available'}

INJURY_KEYWORDS = [
    'hamstring','knee','muscle','ankle','thigh','calf','back','groin',
    'shoulder','foot','hip','achilles','ligament','fracture','illness',
    'hernia','cruciate','acl','tendon','strain','tear','red card',
    'yellow','suspension','suspended',
]


# ── Cache ─────────────────────────────────────────────────────────────
def _cache_path(league):
    return os.path.join(CACHE_DIR, f"injuries_{league.replace(' ','_').replace('/','_')}.json")

def _read_cache(league):
    path = _cache_path(league)
    try:
        if os.path.exists(path) and time.time() - os.path.getmtime(path) < CACHE_TTL:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return None

def _write_cache(league, data):
    try:
        with open(_cache_path(league), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception as e:
        print(f'[InjuryScraper] Cache write error: {e}')


# ── Helpers ───────────────────────────────────────────────────────────
def _is_transfer(news):
    if not news: return False
    return any(kw.lower() in news.lower() for kw in TRANSFER_KEYWORDS)

def _injury_type_from_news(news, status):
    if status == 's': return 'Suspended'
    n = news.lower()
    if 'hamstring' in n: return 'Hamstring Injury'
    if 'knee'      in n or 'cruciate' in n or 'acl' in n: return 'Knee Injury'
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
    if 'knock'     in n or 'dead leg' in n or 'fitness' in n: return 'Doubtful'
    if status == 'd': return 'Doubtful'
    return 'Injured'


# ── FPL (Premier League) ──────────────────────────────────────────────
def _fetch_fpl_injuries():
    try:
        print('[InjuryScraper] Fetching Premier League from FPL API...')
        resp  = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/', timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
        data  = resp.json()
        teams = {t['id']: t for t in data.get('teams', [])}
        injuries = []

        for player in data.get('elements', []):
            status = player.get('status', 'a')
            if status == 'a': continue
            news   = player.get('news', '') or ''
            chance = player.get('chance_of_playing_next_round')

            if _is_transfer(news): continue
            if status == 'u' and not news: continue

            team_id   = player.get('team')
            team_info = teams.get(team_id, {})
            team_name = team_info.get('name', '')
            team_code = team_info.get('code', '')
            player_code = player.get('code', '')

            injuries.append({
                'player':          f"{player.get('first_name','')} {player.get('second_name','')}".strip(),
                'playerPhoto':     f'https://resources.premierleague.com/premierleague/photos/players/110x140/p{player_code}.png' if player_code else '',
                'team':            team_name,
                'teamLogo':        f'https://resources.premierleague.com/premierleague/badges/50/t{team_code}.png' if team_code else '',
                'type':            _injury_type_from_news(news, status),
                'reason':          FPL_STATUS.get(status, 'Unknown'),
                'news':            news,
                'chanceOfPlaying': chance,
                'returnDate':      'Unknown',
                'games_missed':    0,
                'league':          'Premier League',
                'source':          'FPL',
            })

        print(f'[InjuryScraper] FPL: {len(injuries)} players found')
        return injuries
    except Exception as e:
        print(f'[InjuryScraper] FPL error: {e}')
        return []


# ── Transfermarkt ─────────────────────────────────────────────────────
def _fetch_transfermarkt_injuries(league):
    base_url = TM_LEAGUES.get(league)
    if not base_url:
        return []

    injuries = []
    urls = [base_url, base_url.replace('verletztespieler', 'sperrenausfaelle')]

    for page_url in urls:
        try:
            print(f'[InjuryScraper] {league}: Fetching {page_url}')
            session = requests.Session()
            session.get('https://www.transfermarkt.com', headers=HEADERS, timeout=10)
            resp = session.get(page_url, headers=HEADERS, timeout=15)
            print(f'[InjuryScraper] {league}: HTTP {resp.status_code}')

            if resp.status_code in (403, 503, 429, 404):
                print(f'[InjuryScraper] {league}: Blocked/not found at {page_url}')
                continue

            soup  = BeautifulSoup(resp.text, 'lxml')
            table = soup.find('table', {'class': 'items'})
            if not table:
                print(f'[InjuryScraper] {league}: No table at {page_url}')
                continue

            rows = table.find('tbody').find_all('tr') if table.find('tbody') else []

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

                    img       = row.find('img', {'class': 'bilderrahmen-fixed'})
                    photo     = (img.get('data-src') or img.get('src', '')) if img else ''
                    team_img  = row.find('img', {'class': 'tiny_wappen'})
                    team_name = team_img.get('title', '') if team_img else ''
                    team_logo = team_img.get('src', '') if team_img else ''

                  # Extract injury type — skip cells with position names
                    injury_type  = 'Injury'
                    POSITIONS = ['goalkeeper','defender','midfielder','forward','centre-back',
                                'left-back','right-back','left winger','right winger',
                                'attacking mid','defensive mid','striker','winger']

                    for cell in cells:
                        txt   = cell.get_text(strip=True)
                        lower = txt.lower()
                        # Skip if it looks like a position (common in suspension pages)
                        if any(pos in lower for pos in POSITIONS):
                            continue
                        if any(kw in lower for kw in INJURY_KEYWORDS):
                            injury_type = txt
                            break
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
                        'type':            injury_type,
                        'reason':          'Injury' if 'susp' not in injury_type.lower() else 'Suspended',
                        'news':            '',
                        'chanceOfPlaying': None,
                        'returnDate':      return_date,
                        'games_missed':    games_missed,
                        'league':          league,
                        'source':          'Transfermarkt',
                    })
                except Exception:
                    continue

        except Exception as e:
            print(f'[InjuryScraper] {league} error at {page_url}: {e}')
            continue

    print(f'[InjuryScraper] {league}: Transfermarkt total {len(injuries)}')
    return injuries
    soup  = BeautifulSoup(resp.text, 'lxml')

# Debug — log all table classes found
all_tables = soup.find_all('table')
print(f'[InjuryScraper] {league}: Found {len(all_tables)} tables, classes: {[t.get("class") for t in all_tables[:5]]}')

table = soup.find('table', {'class': 'items'})
if not table:
    # Try alternative selectors
    table = soup.find('table', {'class': lambda c: c and 'items' in c}) or \
            soup.find('table', id=lambda i: i and 'yw' in str(i)) or \
            (all_tables[0] if all_tables else None)
    print(f'[InjuryScraper] {league}: Used fallback table selector')

# ── TheFishy.net fallback ─────────────────────────────────────────────
def _fetch_fishy_injuries(league):
    table_id = FISHY_LEAGUES.get(league)
    if not table_id:
        return []
    try:
        print(f'[InjuryScraper] {league}: Trying thefishy.net...')
        resp = requests.get(
            f'https://www.thefishy.net/football-injuries.php?table={table_id}',
            headers={'User-Agent': HEADERS['User-Agent']}, timeout=15
        )
        if resp.status_code != 200:
            return []

        soup     = BeautifulSoup(resp.text, 'lxml')
        injuries = []

        for table in soup.find_all('table'):
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if len(cells) < 3: continue
                texts = [c.get_text(strip=True) for c in cells]
                if not texts[0] or texts[0].lower() in ('player','name','team'): continue

                player_name = texts[0]
                team_name   = texts[1] if len(texts) > 1 else ''
                injury_info = texts[2] if len(texts) > 2 else ''
                return_date = texts[3] if len(texts) > 3 else 'Unknown'
                if not player_name or not team_name: continue

                inj = injury_info.lower()
                if   'hamstring'  in inj: injury_type = 'Hamstring Injury'
                elif 'knee'       in inj: injury_type = 'Knee Injury'
                elif 'muscle'     in inj: injury_type = 'Muscle Injury'
                elif 'ankle'      in inj: injury_type = 'Ankle Injury'
                elif 'thigh'      in inj: injury_type = 'Thigh Injury'
                elif 'calf'       in inj: injury_type = 'Calf Injury'
                elif 'back'       in inj: injury_type = 'Back Injury'
                elif 'groin'      in inj: injury_type = 'Groin Injury'
                elif 'shoulder'   in inj: injury_type = 'Shoulder Injury'
                elif 'suspend' in inj or 'red' in inj or 'yellow' in inj: injury_type = 'Suspended'
                elif 'illness'    in inj: injury_type = 'Illness'
                else:                     injury_type = injury_info or 'Injury'

                injuries.append({
                    'player': player_name, 'playerPhoto': '', 'team': team_name,
                    'teamLogo': '', 'type': injury_type, 'reason': injury_info,
                    'news': injury_info, 'chanceOfPlaying': None,
                    'returnDate': return_date or 'Unknown', 'games_missed': 0,
                    'league': league, 'source': 'TheFishy',
                })

        print(f'[InjuryScraper] {league}: thefishy found {len(injuries)}')
        return injuries
    except Exception as e:
        print(f'[InjuryScraper] {league}: thefishy error: {e}')
        return []


# ── API-Football fallback ─────────────────────────────────────────────
def _fetch_apifootball_injuries(league):
    api_key   = os.getenv('API_FOOTBALL_KEY', '')
    league_id = API_FOOTBALL_IDS.get(league)
    if not league_id or not api_key:
        return []
    today = str(dt.today())
    try:
        print(f'[InjuryScraper] {league}: API-Football fallback...')
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
            if pid not in seen or dt_str > seen[pid]['returnDate']:
                seen[pid] = {
                    'player': player.get('name', ''), 'playerPhoto': player.get('photo', ''),
                    'team': team.get('name', ''), 'teamLogo': team.get('logo', ''),
                    'type': player.get('reason', '') or player.get('type', '') or 'Injury',
                    'reason': player.get('type', ''), 'news': '', 'chanceOfPlaying': None,
                    'returnDate': dt_str or 'Unknown', 'games_missed': 0,
                    'league': league, 'source': 'API-Football',
                }
        result = sorted(
            [v for v in seen.values() if v['returnDate'] >= today or v['returnDate'] == 'Unknown'],
            key=lambda x: x['team']
        )
        print(f'[InjuryScraper] {league}: API-Football returned {len(result)}')
        return result
    except Exception as e:
        print(f'[InjuryScraper] {league}: API-Football error: {e}')
        return []


# ── Public API ────────────────────────────────────────────────────────
def get_injuries_scraped(league: str) -> list:
    cached = _read_cache(league)
    if cached is not None:
        print(f'[InjuryScraper] {league}: Serving from cache ({len(cached)})')
        return cached

    if league == 'Premier League':
        data = _fetch_fpl_injuries()
    else:
        data = _fetch_transfermarkt_injuries(league)
        if not data:
            print(f'[InjuryScraper] {league}: TM empty — trying thefishy')
            data = _fetch_fishy_injuries(league)
        if not data:
            print(f'[InjuryScraper] {league}: thefishy empty — using API-Football')
            data = _fetch_apifootball_injuries(league)

    if data:
        _write_cache(league, data)
    return data
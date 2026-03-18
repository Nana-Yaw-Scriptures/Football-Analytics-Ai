"""
Match Prediction Engine v2.3
= v2.1 model logic (proven weights + adjustments)
+ v2.2 caching layer (xG 1hr, H2H 24hr, team-league permanent)
+ v2.2 score separation (predicted_score vs most_likely_score)
+ confidence_level field (Low/Medium/High)
+ Brier score + backtest utilities

Save as: services/match_service.py
"""

import time
from math import factorial, exp
import os
import requests

from services.data_fetcher import (
    fetch_standings, fetch_team_recent_matches, calculate_momentum,
    calculate_elo, parse_form, LEAGUE_CODES
)
from services.understat_scraper import scrape_league_xg, find_team_xg

# ═══════════════════════════════════════════════
# CACHE LAYER  (v2.2)
# ═══════════════════════════════════════════════

_xg_cache          = {}
_h2h_cache         = {}
_team_league_cache = {}
_team_id_cache     = {}

XG_TTL  = 3600
H2H_TTL = 86400

API_KEY      = os.getenv("API_FOOTBALL_KEY", "")
API_HEADERS  = {"x-apisports-key": API_KEY}
API_BASE_URL = "https://v3.football.api-sports.io"

API_FOOTBALL_LEAGUE_IDS = {
    "Premier League": 39,
    "La Liga":        140,
    "Bundesliga":     78,
    "Serie A":        135,
    "Ligue 1":        61,
    "Primeira Liga":  94,
    "Champions League": 2,
}

TEAM_ALIASES = {
    # ── Paris Saint-Germain ──
    "psg": "Paris Saint-Germain", "paris": "Paris Saint-Germain",
    "paris saint-germain": "Paris Saint-Germain",
    "paris saint germain": "Paris Saint-Germain",
    "paris saint-germain fc": "Paris Saint-Germain",
    "paris saint germain fc": "Paris Saint-Germain",

    # ── Ligue 1 ──
    "rennes": "Stade Rennais FC", "stade rennais": "Stade Rennais FC",
    "stade rennais fc": "Stade Rennais FC", "stade rennais fc 1901": "Stade Rennais FC",
    "marseille": "Olympique de Marseille", "om": "Olympique de Marseille",
    "olympique de marseille": "Olympique de Marseille",
    "olympique marseille": "Olympique de Marseille",
    "lyon": "Olympique Lyonnais", "ol": "Olympique Lyonnais",
    "olympique lyonnais": "Olympique Lyonnais",
    "monaco": "AS Monaco", "as monaco": "AS Monaco", "as monaco fc": "AS Monaco",
    "lille": "Lille", "losc": "Lille", "losc lille": "Lille",
    "lens": "Lens", "racing club de lens": "Lens", "rc lens": "Lens",
    "nice": "OGC Nice", "ogc nice": "OGC Nice",
    "strasbourg": "RC Strasbourg Alsace", "rc strasbourg": "RC Strasbourg Alsace",
    "nantes": "FC Nantes", "fc nantes": "FC Nantes",
    "reims": "Stade de Reims", "stade de reims": "Stade de Reims",
    "montpellier": "Montpellier", "mhsc": "Montpellier",
    "toulouse": "Toulouse FC", "toulouse fc": "Toulouse FC",
    "brest": "Stade Brestois 29", "stade brestois": "Stade Brestois 29",
    "le havre": "Le Havre AC", "le havre ac": "Le Havre AC", "havre": "Le Havre AC",
    "lorient": "FC Lorient", "fc lorient": "FC Lorient",
    "angers": "Angers SCO", "angers sco": "Angers SCO",
    "metz": "FC Metz", "fc metz": "FC Metz",
    "auxerre": "AJ Auxerre", "aj auxerre": "AJ Auxerre",
    "saint-etienne": "AS Saint-Étienne", "st etienne": "AS Saint-Étienne",
    "as saint-etienne": "AS Saint-Étienne",

    # ── Premier League ──
    "arsenal": "Arsenal", "arsenal fc": "Arsenal",
    "chelsea": "Chelsea", "chelsea fc": "Chelsea",
    "liverpool": "Liverpool", "liverpool fc": "Liverpool",
    "man city": "Manchester City", "manchester city": "Manchester City",
    "manchester city fc": "Manchester City",
    "man utd": "Manchester United", "man united": "Manchester United",
    "manchester united": "Manchester United", "manchester united fc": "Manchester United",
    "spurs": "Tottenham Hotspur", "tottenham": "Tottenham Hotspur",
    "tottenham hotspur": "Tottenham Hotspur", "tottenham hotspur fc": "Tottenham Hotspur",
    "newcastle": "Newcastle United", "newcastle united": "Newcastle United",
    "newcastle united fc": "Newcastle United",
    "west ham": "West Ham United", "west ham united": "West Ham United",
    "west ham united fc": "West Ham United",
    "aston villa": "Aston Villa", "villa": "Aston Villa", "aston villa fc": "Aston Villa",
    "brighton": "Brighton & Hove Albion", "brighton & hove albion": "Brighton & Hove Albion",
    "brentford": "Brentford", "brentford fc": "Brentford",
    "fulham": "Fulham", "fulham fc": "Fulham",
    "palace": "Crystal Palace", "crystal palace": "Crystal Palace",
    "crystal palace fc": "Crystal Palace",
    "wolves": "Wolverhampton Wanderers", "wolverhampton": "Wolverhampton Wanderers",
    "wolverhampton wanderers": "Wolverhampton Wanderers",
    "forest": "Nottingham Forest", "nottingham forest": "Nottingham Forest",
    "everton": "Everton", "everton fc": "Everton",
    "bournemouth": "AFC Bournemouth", "afc bournemouth": "AFC Bournemouth",
    "leicester": "Leicester City", "leicester city": "Leicester City",
    "leicester city fc": "Leicester City",
    "southampton": "Southampton", "southampton fc": "Southampton",
    "ipswich": "Ipswich Town", "ipswich town": "Ipswich Town",
    "leeds": "Leeds United", "leeds united": "Leeds United",
    "burnley": "Burnley", "burnley fc": "Burnley",
    "sunderland": "Sunderland", "sunderland afc": "Sunderland",
    "sheffield united": "Sheffield United", "sheffield utd": "Sheffield United",

    # ── La Liga ──
    "barca": "FC Barcelona", "barcelona": "FC Barcelona", "fc barcelona": "FC Barcelona",
    "real": "Real Madrid", "real madrid": "Real Madrid", "real madrid cf": "Real Madrid",
    "atletico": "Atlético de Madrid", "atletico madrid": "Atlético de Madrid",
    "atletico de madrid": "Atlético de Madrid",
    "club atletico de madrid": "Atlético de Madrid",
    "sevilla": "Sevilla FC", "sevilla fc": "Sevilla FC",
    "betis": "Real Betis", "real betis": "Real Betis",
    "real betis balompie": "Real Betis",
    "villarreal": "Villarreal CF", "villarreal cf": "Villarreal CF",
    "sociedad": "Real Sociedad", "real sociedad": "Real Sociedad",
    "real sociedad de futbol": "Real Sociedad",
    "athletic bilbao": "Athletic Club", "athletic club": "Athletic Club",
    "valencia": "Valencia CF", "valencia cf": "Valencia CF",
    "osasuna": "CA Osasuna", "ca osasuna": "CA Osasuna",
    "celta vigo": "RC Celta de Vigo", "celta": "RC Celta de Vigo",
    "getafe": "Getafe CF", "getafe cf": "Getafe CF",
    "rayo vallecano": "Rayo Vallecano", "rayo": "Rayo Vallecano",
    "alaves": "Deportivo Alavés", "deportivo alaves": "Deportivo Alavés",
    "mallorca": "RCD Mallorca", "rcd mallorca": "RCD Mallorca",
    "girona": "Girona FC", "girona fc": "Girona FC",
    "las palmas": "UD Las Palmas", "ud las palmas": "UD Las Palmas",
    "espanyol": "RCD Espanyol", "rcd espanyol": "RCD Espanyol",
    "leganes": "CD Leganés", "cd leganes": "CD Leganés",

    # ── Bundesliga ──
    "bayern": "Bayern München", "bayern munich": "Bayern München",
    "fc bayern münchen": "Bayern München", "fc bayern munich": "Bayern München",
    "dortmund": "Borussia Dortmund", "borussia dortmund": "Borussia Dortmund",
    "bvb": "Borussia Dortmund",
    "leverkusen": "Bayer Leverkusen", "bayer leverkusen": "Bayer Leverkusen",
    "bayer 04 leverkusen": "Bayer Leverkusen",
    "leipzig": "RB Leipzig", "rb leipzig": "RB Leipzig",
    "frankfurt": "Eintracht Frankfurt", "eintracht frankfurt": "Eintracht Frankfurt",
    "wolfsburg": "VfL Wolfsburg", "vfl wolfsburg": "VfL Wolfsburg",
    "gladbach": "Borussia Mönchengladbach", "monchengladbach": "Borussia Mönchengladbach",
    "borussia monchengladbach": "Borussia Mönchengladbach",
    "borussia mönchengladbach": "Borussia Mönchengladbach",
    "freiburg": "SC Freiburg", "sc freiburg": "SC Freiburg",
    "hoffenheim": "TSG Hoffenheim", "tsg hoffenheim": "TSG Hoffenheim",
    "stuttgart": "VfB Stuttgart", "vfb stuttgart": "VfB Stuttgart",
    "augsburg": "FC Augsburg", "fc augsburg": "FC Augsburg",
    "mainz": "FSV Mainz 05", "fsv mainz": "FSV Mainz 05", "1. fsv mainz 05": "FSV Mainz 05",
    "cologne": "FC Köln", "koln": "FC Köln", "fc koln": "FC Köln", "1. fc köln": "FC Köln",
    "union berlin": "1. FC Union Berlin", "1. fc union berlin": "1. FC Union Berlin",
    "hertha": "Hertha BSC", "hertha berlin": "Hertha BSC", "hertha bsc": "Hertha BSC",
    "werder bremen": "Werder Bremen", "werder": "Werder Bremen",
    "bochum": "VfL Bochum", "vfl bochum": "VfL Bochum",
    "heidenheim": "1. FC Heidenheim", "1. fc heidenheim": "1. FC Heidenheim",
    "st. pauli": "FC St. Pauli", "fc st. pauli": "FC St. Pauli", "st pauli": "FC St. Pauli",
    "holstein kiel": "Holstein Kiel",

    # ── Serie A ──
    "juventus": "Juventus", "juve": "Juventus", "juventus fc": "Juventus",
    "inter": "Internazionale", "inter milan": "Internazionale",
    "fc internazionale milano": "Internazionale", "internazionale": "Internazionale",
    "ac milan": "AC Milan", "milan": "AC Milan",
    "napoli": "Napoli", "ssc napoli": "Napoli",
    "roma": "AS Roma", "as roma": "AS Roma",
    "lazio": "Lazio", "ss lazio": "Lazio",
    "atalanta": "Atalanta", "atalanta bc": "Atalanta",
    "fiorentina": "Fiorentina", "acf fiorentina": "Fiorentina",
    "torino": "Torino FC", "torino fc": "Torino FC",
    "bologna": "Bologna FC", "bologna fc": "Bologna FC", "bologna fc 1909": "Bologna FC",
    "udinese": "Udinese Calcio", "udinese calcio": "Udinese Calcio",
    "genoa": "Genoa CFC", "genoa cfc": "Genoa CFC",
    "sampdoria": "Sampdoria", "uc sampdoria": "Sampdoria",
    "sassuolo": "US Sassuolo", "us sassuolo": "US Sassuolo",
    "empoli": "Empoli FC", "empoli fc": "Empoli FC",
    "lecce": "US Lecce", "us lecce": "US Lecce",
    "como": "Como 1907", "como 1907": "Como 1907", "calcio como": "Como 1907",
    "cagliari": "Cagliari Calcio", "cagliari calcio": "Cagliari Calcio",
    "venezia": "Venezia FC", "venezia fc": "Venezia FC",
    "hellas verona": "Hellas Verona", "verona": "Hellas Verona",
    "monza": "AC Monza", "ac monza": "AC Monza",
    "parma": "Parma Calcio 1913", "parma calcio": "Parma Calcio 1913",

# ── Primeira Liga (Liga NOS) ──
"benfica": "SL Benfica", "sl benfica": "SL Benfica", "sport lisboa e benfica": "SL Benfica",
"porto": "FC Porto", "fc porto": "FC Porto",
"sporting": "Sporting CP", "sporting cp": "Sporting CP", "sporting clube de portugal": "Sporting CP",
"braga": "SC Braga", "sp braga": "SC Braga", "sporting braga": "SC Braga",
"guimaraes": "Vitória SC", "vitoria guimaraes": "Vitória SC", "vitória sc": "Vitória SC",
"vitoria sc": "Vitória SC",
"setubal": "Vitória FC", "vitoria setubal": "Vitória FC", "vitória fc": "Vitória FC",
"vitoria fc": "Vitória FC",
"famalicao": "FC Famalicão", "fc famalicao": "FC Famalicão",
"boavista": "Boavista FC", "boavista fc": "Boavista FC",
"santa clara": "CD Santa Clara", "cd santa clara": "CD Santa Clara",
"gil vicente": "Gil Vicente FC", "gil vicente fc": "Gil Vicente FC",
"estoril": "GD Estoril Praia", "estoril praia": "GD Estoril Praia",
"casa pia": "Casa Pia AC", "casa pia ac": "Casa Pia AC",
"moreirense": "Moreirense FC", "moreirense fc": "Moreirense FC",
"arouca": "FC Arouca", "fc arouca": "FC Arouca",
"chaves": "GD Chaves", "gd chaves": "GD Chaves",
"vizela": "FC Vizela", "fc vizela": "FC Vizela",
"pacos ferreira": "FC Paços de Ferreira", "pacos de ferreira": "FC Paços de Ferreira",
"fc pacos de ferreira": "FC Paços de Ferreira",
"rio ave": "Rio Ave FC", "rio ave fc": "Rio Ave FC",
"nacional": "CD Nacional", "cd nacional": "CD Nacional",
"farense": "SC Farense", "sc farense": "SC Farense",
"estrela amadora": "CF Estrela da Amadora", "estrela": "CF Estrela da Amadora",
"AVS": "AVS Futebol SAD", "avs": "AVS Futebol SAD",

# ── UCL participants from non-covered leagues ──
"ajax": "AFC Ajax", "afc ajax": "AFC Ajax",
"psv": "PSV Eindhoven", "psv eindhoven": "PSV Eindhoven",
"celtic": "Celtic FC", "celtic fc": "Celtic FC",
"rangers": "Rangers FC", "rangers fc": "Rangers FC",
"club brugge": "Club Brugge KV", "brugge": "Club Brugge KV",
"anderlecht": "RSC Anderlecht", "rsc anderlecht": "RSC Anderlecht",
"feyenoord": "Feyenoord", "feyenoord rotterdam": "Feyenoord",
"salzburg": "FC Red Bull Salzburg", "red bull salzburg": "FC Red Bull Salzburg",
"shakhtar": "Shakhtar Donetsk", "shakhtar donetsk": "Shakhtar Donetsk",
"benfica": "SL Benfica",
"young boys": "BSC Young Boys", "bsc young boys": "BSC Young Boys",
"galatasaray": "Galatasaray SK", "galatasaray sk": "Galatasaray SK",
"fenerbahce": "Fenerbahçe SK", "fenerbahce sk": "Fenerbahçe SK",
"dinamo zagreb": "GNK Dinamo Zagreb", "gnk dinamo": "GNK Dinamo Zagreb",
}

LEAGUE_HOME_ADVANTAGE = {
    "Premier League": {"attack_boost": 1.08, "defense_boost": 0.94},
    "La Liga":        {"attack_boost": 1.09, "defense_boost": 0.93},
    "Bundesliga":     {"attack_boost": 1.10, "defense_boost": 0.92},
    "Serie A":        {"attack_boost": 1.08, "defense_boost": 0.94},
    "Ligue 1":        {"attack_boost": 1.10, "defense_boost": 0.92},
    "Primeira Liga":  {"attack_boost": 1.09, "defense_boost": 0.93},    
    "Champions League": {"attack_boost": 1.10, "defense_boost": 0.92},
}


# ═══════════════════════════════════════════════
# CACHED FETCHERS
# ═══════════════════════════════════════════════

def _get_xg_data(league: str, season: str = "2025") -> dict:
    key = f"{league}:{season}"
    now = time.time()
    if key in _xg_cache:
        ts, data = _xg_cache[key]
        if now - ts < XG_TTL:
            return data
    try:
        data = scrape_league_xg(league, season)
    except Exception:
        data = {}
    _xg_cache[key] = (now, data)
    return data


def _get_team_id(name: str, league: str = None):
    cache_key = f"{name.lower()}:{league or ''}"
    if cache_key in _team_id_cache:
        return _team_id_cache[cache_key]
    if league and league in API_FOOTBALL_LEAGUE_IDS:
        try:
            resp = requests.get(
                f"{API_BASE_URL}/teams", headers=API_HEADERS,
                params={"league": API_FOOTBALL_LEAGUE_IDS[league], "season": 2025},
                timeout=5,
            )
            nl = name.lower()
            for entry in resp.json().get("response", []):
                tn = entry["team"]["name"].lower()
                if nl in tn or tn in nl:
                    tid = entry["team"]["id"]
                    _team_id_cache[cache_key] = tid
                    return tid
        except Exception:
            pass
    WOMENS = (" w", "women", "femenino", "feminin", "dames", "ladies", "frauen", " wfc")
    try:
        resp = requests.get(f"{API_BASE_URL}/teams", headers=API_HEADERS,
                            params={"search": name}, timeout=5)
        for entry in resp.json().get("response", []):
            tn = entry["team"]["name"].lower()
            if not (tn.endswith(" w") or any(m in tn for m in WOMENS[1:])):
                tid = entry["team"]["id"]
                _team_id_cache[cache_key] = tid
                return tid
    except Exception:
        pass
    return None


def fetch_h2h_data(home_name: str, away_name: str,
                   home_league: str = None, away_league: str = None):
    cache_key = f"{home_name.lower()}:{away_name.lower()}"
    now = time.time()
    if cache_key in _h2h_cache:
        ts, data = _h2h_cache[cache_key]
        if now - ts < H2H_TTL:
            return data
    if not API_KEY:
        return None
    try:
        home_id = _get_team_id(home_name, home_league)
        away_id = _get_team_id(away_name, away_league)
        if not home_id or not away_id:
            _h2h_cache[cache_key] = (now, None)
            return None
        resp = requests.get(
            f"{API_BASE_URL}/fixtures/headtohead", headers=API_HEADERS,
            params={"h2h": f"{home_id}-{away_id}", "last": 10}, timeout=5,
        )
        fixtures = resp.json().get("response", [])
        if not fixtures:
            _h2h_cache[cache_key] = (now, None)
            return None
        home_wins = away_wins = draws = home_goals_total = away_goals_total = 0
        for fix in fixtures:
            hg = fix["goals"]["home"] or 0
            ag = fix["goals"]["away"] or 0
            h_is_home = fix["teams"]["home"]["id"] == home_id
            if h_is_home:
                home_goals_total += hg; away_goals_total += ag
                if hg > ag: home_wins += 1
                elif hg < ag: away_wins += 1
                else: draws += 1
            else:
                home_goals_total += ag; away_goals_total += hg
                if ag > hg: home_wins += 1
                elif ag < hg: away_wins += 1
                else: draws += 1
        total = len(fixtures)
        result = {
            "total_matches":  total,
            "home_wins":      home_wins,
            "away_wins":      away_wins,
            "draws":          draws,
            "home_win_rate":  home_wins / max(total, 1),
            "away_win_rate":  away_wins / max(total, 1),
            "draw_rate":      draws / max(total, 1),
            "home_avg_goals": home_goals_total / max(total, 1),
            "away_avg_goals": away_goals_total / max(total, 1),
            "home_dominance": (home_wins - away_wins) / max(total, 1),
        }
        _h2h_cache[cache_key] = (now, result)
        return result
    except Exception as e:
        print(f"H2H error: {e}")
        _h2h_cache[cache_key] = (now, None)
        return None


# ═══════════════════════════════════════════════
# HELPERS  (v2.1 unchanged)
# ═══════════════════════════════════════════════

def resolve_team_name(name: str) -> str:
    return TEAM_ALIASES.get(name.strip().lower(), name)


def poisson_prob(lam: float, k: int) -> float:
    return (exp(-lam) * lam**k) / factorial(k)


def calculate_match_probabilities(home_xg, away_xg, max_goals=7):
    home_win = draw = away_win = 0.0
    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            p = poisson_prob(home_xg, h) * poisson_prob(away_xg, a)
            if h > a: home_win += p
            elif h == a: draw += p
            else: away_win += p
    total = home_win + draw + away_win
    return home_win / total, draw / total, away_win / total


def find_team_in_standings(team_name, league):
    try:
        standings = fetch_standings(league)
        match = standings[standings["team"].str.contains(team_name, case=False, na=False)]
        if not match.empty:
            return match.iloc[0]["team"], standings
    except Exception:
        pass
    return None, None


def find_team_any_league(team_name):
    if team_name in _team_league_cache:
        league, canonical = _team_league_cache[team_name]
        found, standings = find_team_in_standings(canonical, league)
        if found:
            return found, league, standings
    for league in LEAGUE_CODES:
        if league == "Champions League":
            continue
        found, standings = find_team_in_standings(team_name, league)
        if found:
            _team_league_cache[team_name] = (league, found)
            return found, league, standings
    return None, None, None


def weighted_recent_form(recent_matches, decay=0.87):
    if not recent_matches:
        return 0, 0, 0
    total_weight = weighted_gpg = weighted_gapg = weighted_points = 0.0
    for i, match in enumerate(reversed(recent_matches)):
        w = decay ** i
        total_weight += w
        weighted_gpg  += (match.get("goals_for", 0) or 0) * w
        weighted_gapg += (match.get("goals_against", 0) or 0) * w
        pts = 3 if match.get("result") == "W" else 1 if match.get("result") == "D" else 0
        weighted_points += pts * w
    if total_weight == 0:
        return 0, 0, 0
    return weighted_gpg/total_weight, weighted_gapg/total_weight, weighted_points/total_weight


def elo_adjustment(h_row, a_row, standings):
    pts_gap = float(h_row["points"]) - float(a_row["points"])
    adjust  = max(-0.20, min(0.20, pts_gap * 0.005))
    return 1 + adjust, 1 - adjust


def xg_regression_factor(xg_info, goals_actual, games_played):
    if not xg_info or games_played < 5:
        return 1.0
    xg_total = xg_info.get("xg_per_game", 0) * games_played
    diff = goals_actual - xg_total
    if abs(diff) < 4:
        return 1.0
    regression = min(abs(diff) * 0.008, 0.08)
    return (1 - regression) if diff > 0 else (1 + regression)


def confidence_level(win_prob: float) -> str:
    if win_prob >= 0.62:   return "High"
    elif win_prob >= 0.45: return "Medium"
    return "Low"


# ═══════════════════════════════════════════════
# BRIER + BACKTEST  (v2.2)
# ═══════════════════════════════════════════════

def brier_score(predictions: list) -> dict:
    if not predictions:
        return {"brier_score": None, "n": 0, "calibration": "No data"}
    total = 0.0
    for p in predictions:
        actual = p.get("actual_outcome", "")
        o_hw = 1 if actual == "home_win" else 0
        o_d  = 1 if actual == "draw"     else 0
        o_aw = 1 if actual == "away_win" else 0
        total += (
            (p.get("home_win", 0) - o_hw) ** 2 +
            (p.get("draw",     0) - o_d)  ** 2 +
            (p.get("away_win", 0) - o_aw) ** 2
        )
    bs = total / len(predictions)
    cal = ("Excellent" if bs < 0.40 else "Good" if bs < 0.50
           else "Fair" if bs < 0.60 else "Poor — recalibrate weights")
    return {"brier_score": round(bs, 4), "n": len(predictions),
            "calibration": cal, "baseline_random": 0.667}


def backtest_against_results(league: str, season: str = "2025") -> dict:
    try:
        from services.data_fetcher import fetch_matches
        matches_df = fetch_matches(league, status="FINISHED", limit=100, season=int(season))
        if matches_df.empty:
            return {"error": "No finished matches found"}
        predictions = []
        correct = 0
        for _, m in matches_df.iterrows():
            try:
                class _Req:
                    home_team = m["home_team"]
                    away_team = m["away_team"]
                result = get_match_prediction(_Req())
                hg = m.get("home_goals", 0) or 0
                ag = m.get("away_goals", 0) or 0
                actual = "home_win" if hg > ag else "away_win" if ag > hg else "draw"
                pred_cat = (
                    "home_win" if result["home_win"] == max(result["home_win"], result["draw"], result["away_win"])
                    else "away_win" if result["away_win"] == max(result["home_win"], result["draw"], result["away_win"])
                    else "draw"
                )
                predictions.append({**result, "actual_outcome": actual, "predicted": pred_cat})
                if pred_cat == actual:
                    correct += 1
            except Exception:
                continue
        bs = brier_score(predictions)
        return {**bs, "accuracy": round(correct/max(len(predictions),1), 4),
                "matches_tested": len(predictions), "league": league, "season": season}
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════
# MAIN PREDICTION  (v2.1 logic + v2.2 caching)
# ═══════════════════════════════════════════════

def get_match_prediction(req, model=None):
    key_factors = []

    home_input = resolve_team_name(req.home_team)
    away_input = resolve_team_name(req.away_team)

    home_team, home_league, home_standings = find_team_any_league(home_input)
    away_team, away_league, away_standings = find_team_any_league(away_input)

    if home_team is None:
        raise ValueError(f"Could not find '{req.home_team}' in any of the 6 European leagues.")
    if away_team is None:
        raise ValueError(f"Could not find '{req.away_team}' in any of the 6 European leagues.")

    standings = home_standings if home_league == away_league else home_standings
    h_row = standings[standings["team"] == home_team].iloc[0]
    a_row = (standings if home_league == away_league else away_standings)
    a_row = a_row[a_row["team"] == away_team].iloc[0]

    h_played = max(h_row["played"], 1)
    a_played = max(a_row["played"], 1)

    # ── All external data fetched once (all cached) ──
    xg_home_cache = _get_xg_data(home_league)
    xg_away_cache = _get_xg_data(away_league) if away_league != home_league else xg_home_cache

    h_xg_info = find_team_xg(home_team, home_league, {home_league: xg_home_cache})
    a_xg_info = find_team_xg(
        away_team,
        away_league if away_league != home_league else home_league,
        {(away_league if away_league != home_league else home_league): xg_away_cache}
    )

    h_recent = fetch_team_recent_matches(h_row["team_id"], limit=10)
    a_recent = fetch_team_recent_matches(a_row["team_id"], limit=10)
    h2h      = fetch_h2h_data(home_team, away_team,
                               home_league=home_league, away_league=away_league)

    h_mom = calculate_momentum(h_recent)
    a_mom = calculate_momentum(a_recent)
    h_w_gpg, h_w_gapg, h_w_ppg = weighted_recent_form(h_recent)
    a_w_gpg, a_w_gapg, a_w_ppg = weighted_recent_form(a_recent)

    h_attack  = h_row["goals_for"]     / h_played
    h_defense = h_row["goals_against"] / h_played
    a_attack  = a_row["goals_for"]     / a_played
    a_defense = a_row["goals_against"] / a_played

    h_attack_xg    = h_xg_info["xg_per_game"]  if h_xg_info else h_attack
    h_defense_xg   = h_xg_info["xga_per_game"] if h_xg_info else h_defense
    h_home_attack  = h_xg_info["home_xg_pg"]   if h_xg_info else h_attack
    h_home_defense = h_xg_info["home_xga_pg"]  if h_xg_info else h_defense
    a_attack_xg    = a_xg_info["xg_per_game"]  if a_xg_info else a_attack
    a_defense_xg   = a_xg_info["xga_per_game"] if a_xg_info else a_defense
    a_away_attack  = a_xg_info["away_xg_pg"]   if a_xg_info else a_attack
    a_away_defense = a_xg_info["away_xga_pg"]  if a_xg_info else a_defense

    h_regress = xg_regression_factor(h_xg_info, h_row["goals_for"], h_played)
    a_regress = xg_regression_factor(a_xg_info, a_row["goals_for"], a_played)

    # H2H boosts
    h2h_home_boost = h2h_away_boost = 0.0
    h2h_factors = []
    if h2h and h2h["total_matches"] >= 3:
        dominance  = h2h["home_dominance"]
        abs_dom    = abs(dominance)
        h2h_impact = 0.16 if abs_dom > 0.4 else 0.11 if abs_dom > 0.2 else 0.06
        h2h_home_boost = dominance * h2h_impact
        h2h_away_boost = -dominance * h2h_impact
        h2h_factors.append(
            f"H2H: {h2h['home_wins']}W {h2h['draws']}D {h2h['away_wins']}L "
            f"(last {h2h['total_matches']})"
        )
        if abs_dom > 0.3:
            dominant = home_team if dominance > 0 else away_team
            h2h_factors.append(f"{dominant} dominates head-to-head record")

    h_elo_mult, a_elo_mult = elo_adjustment(h_row, a_row, standings)

    # Expected goals blend
    season_home_xg = (h_attack_xg   + a_defense_xg)  / 2
    season_away_xg = (a_attack_xg   + h_defense_xg)  / 2
    venue_home_xg  = (h_home_attack + a_away_defense) / 2
    venue_away_xg  = (a_away_attack + h_home_defense) / 2
    form_home_xg   = (h_w_gpg + a_w_gapg) / 2 if h_w_gpg > 0 else h_attack
    form_away_xg   = (a_w_gpg + h_w_gapg) / 2 if a_w_gpg > 0 else a_attack

    if h2h and h2h["total_matches"] >= 3:
        abs_dom    = abs(h2h["home_dominance"])
        h2h_weight = 0.08 if abs_dom < 0.2 else 0.12 if abs_dom < 0.4 else 0.17
        remaining  = 1.0 - h2h_weight - 0.08
        home_expected_goals = (
            (remaining * 0.30) * season_home_xg +
            (remaining * 0.35) * venue_home_xg  +
            (remaining * 0.35) * form_home_xg   +
            h2h_weight * h2h["home_avg_goals"]  +
            0.08 * h_attack
        )
        away_expected_goals = (
            (remaining * 0.30) * season_away_xg +
            (remaining * 0.35) * venue_away_xg  +
            (remaining * 0.35) * form_away_xg   +
            h2h_weight * h2h["away_avg_goals"]  +
            0.08 * a_attack
        )
    else:
        home_expected_goals = (
            0.30 * season_home_xg + 0.30 * venue_home_xg +
            0.30 * form_home_xg   + 0.10 * h_attack
        )
        away_expected_goals = (
            0.30 * season_away_xg + 0.30 * venue_away_xg +
            0.30 * form_away_xg   + 0.10 * a_attack
        )

    # Adjustments (v2.1)
    home_expected_goals *= h_elo_mult
    away_expected_goals *= a_elo_mult

    home_expected_goals *= h_regress
    away_expected_goals *= a_regress
    if h_regress < 0.97:
        key_factors.append(f"{home_team} xG regression ({h_regress:.2f}× — outperforming xG)")
    if a_regress < 0.97:
        key_factors.append(f"{away_team} xG regression ({a_regress:.2f}× — outperforming xG)")

    home_expected_goals *= (1 + h2h_home_boost)
    away_expected_goals *= (1 + h2h_away_boost)

    if h_mom["win_streak"] >= 2 and h_w_ppg < 2.0:
        home_expected_goals *= (1 + min(h_mom["win_streak"] * 0.025, 0.12))
    if h_mom["loss_streak"] >= 2 and h_w_ppg > 1.2:
        penalty = min(h_mom["loss_streak"] * 0.035, 0.15)
        home_expected_goals *= (1 - penalty)
        away_expected_goals *= (1 + penalty * 0.35)
    if a_mom["win_streak"] >= 2 and a_w_ppg < 2.0:
        away_expected_goals *= (1 + min(a_mom["win_streak"] * 0.025, 0.12))
    if a_mom["loss_streak"] >= 2 and a_w_ppg > 1.2:
        penalty = min(a_mom["loss_streak"] * 0.035, 0.15)
        away_expected_goals *= (1 - penalty)
        home_expected_goals *= (1 + penalty * 0.35)

    if h_w_ppg > 2.3:   home_expected_goals *= 1.04
    elif h_w_ppg < 0.9: home_expected_goals *= 0.95
    if a_w_ppg > 2.3:   away_expected_goals *= 1.04
    elif a_w_ppg < 0.9: away_expected_goals *= 0.95

    ha         = LEAGUE_HOME_ADVANTAGE.get(home_league, {"attack_boost": 1.08, "defense_boost": 0.94})
    ha_attack  = ha["attack_boost"]
    ha_defense = ha["defense_boost"]

    away_advantages = sum([
        1 if h2h and h2h["home_dominance"] < -0.2 else 0,
        1 if a_w_ppg > h_w_ppg + 0.3 else 0,
        1 if a_attack_xg > h_attack_xg + 0.2 else 0,
        1 if a_row["points"] > h_row["points"] else 0,
    ])
    if away_advantages >= 3:
        ha_attack = 1.02; ha_defense = 0.98
        key_factors.append(f"{away_team} quality neutralises home advantage")
    elif away_advantages >= 2:
        ha_attack  = max(1.03, ha_attack  - 0.05)
        ha_defense = min(0.97, ha_defense + 0.03)

    if h2h and h2h["home_dominance"] < -0.3:
        reduction  = min(abs(h2h["home_dominance"]) * 0.4, 0.08)
        ha_attack  = max(0.98, ha_attack  - reduction)
        ha_defense = min(1.02, ha_defense + reduction)

    home_expected_goals *= ha_attack
    away_expected_goals *= ha_defense

    if home_league != away_league:
        home_expected_goals *= 0.97
        away_expected_goals *= 1.03

    home_expected_goals = max(0.35, min(3.5, home_expected_goals))
    away_expected_goals = max(0.30, min(3.2, away_expected_goals))

    home_win, draw, away_win = calculate_match_probabilities(
        home_expected_goals, away_expected_goals
    )

    xg_diff = abs(home_expected_goals - away_expected_goals)
    if xg_diff < 0.3:    draw_boost = 0.07
    elif xg_diff < 0.6:  draw_boost = 0.05
    elif xg_diff < 1.0:  draw_boost = 0.03
    else:                draw_boost = 0.01

    draw += draw_boost
    total_hw_aw = home_win + away_win
    if total_hw_aw > 0:
        home_win -= draw_boost * (home_win / total_hw_aw)
        away_win -= draw_boost * (away_win / total_hw_aw)

    total = home_win + draw + away_win
    home_win /= total; draw /= total; away_win /= total

    max_prob = max(home_win, draw, away_win)
    if max_prob == home_win:   predicted = f"{home_team} Win"
    elif max_prob == away_win: predicted = f"{away_team} Win"
    else:                      predicted = "Draw"

    h_form_sequence = [m["result"] for m in h_recent[-5:]]
    a_form_sequence = [m["result"] for m in a_recent[-5:]]

    key_factors.append(f"Expected goals: {home_team} {home_expected_goals:.2f} - {away_expected_goals:.2f} {away_team}")
    h_rw = int(h_mom["recent_wins"]); h_rl = int(h_mom["recent_losses"]); h_rd = len(h_recent) - h_rw - h_rl
    a_rw = int(a_mom["recent_wins"]); a_rl = int(a_mom["recent_losses"]); a_rd = len(a_recent) - a_rw - a_rl
    key_factors.append(f"{home_team} form: {h_rw}W {h_rd}D {h_rl}L (last {len(h_recent)})")
    key_factors.append(f"{away_team} form: {a_rw}W {a_rd}D {a_rl}L (last {len(a_recent)})")

    if h_w_ppg > 2.3:   key_factors.append(f"{home_team} in exceptional form ({h_w_ppg:.1f} wpg)")
    elif h_w_ppg < 0.9: key_factors.append(f"{home_team} in poor form ({h_w_ppg:.1f} wpg)")
    if a_w_ppg > 2.3:   key_factors.append(f"{away_team} in exceptional form ({a_w_ppg:.1f} wpg)")
    elif a_w_ppg < 0.9: key_factors.append(f"{away_team} in poor form ({a_w_ppg:.1f} wpg)")

    if h_mom["win_streak"]  >= 2: key_factors.append(f"{home_team} on {h_mom['win_streak']}-game winning streak")
    if h_mom["loss_streak"] >= 2: key_factors.append(f"{home_team} on {h_mom['loss_streak']}-game losing streak")
    if a_mom["win_streak"]  >= 2: key_factors.append(f"{away_team} on {a_mom['win_streak']}-game winning streak")
    if a_mom["loss_streak"] >= 2: key_factors.append(f"{away_team} on {a_mom['loss_streak']}-game losing streak")

    key_factors.extend(h2h_factors)
    if h2h and abs(h2h["home_dominance"]) > 0.2:
        impact_pct = abs(h2h_home_boost) * 100
        favored    = home_team if h2h["home_dominance"] > 0 else away_team
        key_factors.append(f"H2H impact: {favored} boosted ~{impact_pct:.0f}% from head-to-head record")

    h_pos = int(h_row["position"]); a_pos = int(a_row["position"])
    key_factors.append(
        f"Table: {home_team} {h_pos}th ({int(h_row['points'])}pts) vs "
        f"{away_team} {a_pos}th ({int(a_row['points'])}pts)"
    )
    pts_diff = abs(int(h_row['points']) - int(a_row['points']))
    if pts_diff > 15:
        stronger = home_team if h_row['points'] > a_row['points'] else away_team
        key_factors.append(f"Significant quality gap: {stronger} {pts_diff}pts above opponent")

    key_factors.append(f"Season xG/game: {home_team} {h_attack_xg:.2f} vs {away_team} {a_attack_xg:.2f}")
    if h_xg_info: key_factors.append(f"{home_team} home xG: {h_home_attack:.2f} (concede {h_home_defense:.2f})")
    if a_xg_info: key_factors.append(f"{away_team} away xG: {a_away_attack:.2f} (concede {a_away_defense:.2f})")
    if home_league != away_league: key_factors.append(f"Cross-league: {home_league} vs {away_league}")

    components = ["Poisson", "xG", "Weighted Form", "Home Advantage"]
    if h2h: components.append("H2H")
    key_factors.append(f"Model v2.3: {' + '.join(components)}")

    # Scorelines
    scorelines = []
    for hg in range(6):
        for ag in range(6):
            p = poisson_prob(home_expected_goals, hg) * poisson_prob(away_expected_goals, ag)
            scorelines.append({"score": f"{hg}-{ag}", "home_goals": hg, "away_goals": ag,
                                "probability": round(p * 100, 1)})
    scorelines.sort(key=lambda x: x["probability"], reverse=True)

    # Predicted score — outcome aligned (v2.2)
    if predicted == f"{home_team} Win":
        win_lines  = [s for s in scorelines if s["home_goals"] > s["away_goals"]]
        pred_score = win_lines[0]["score"]  if win_lines  else "1-0"
    elif predicted == f"{away_team} Win":
        win_lines  = [s for s in scorelines if s["away_goals"] > s["home_goals"]]
        pred_score = win_lines[0]["score"]  if win_lines  else "0-1"
    else:
        draw_lines = [s for s in scorelines if s["home_goals"] == s["away_goals"]]
        pred_score = draw_lines[0]["score"] if draw_lines else "1-1"

    most_likely = scorelines[0]["score"] if scorelines else "1-1"

    if xg_diff < 0.3:    difficulty = 9
    elif xg_diff < 0.5:  difficulty = 8
    elif xg_diff < 0.8:  difficulty = 7
    elif xg_diff < 1.2:  difficulty = 5
    else:                difficulty = 3

    return {
        "home_win":             round(home_win, 4),
        "draw":                 round(draw, 4),
        "away_win":             round(away_win, 4),
        "predicted_outcome":    predicted,
        "confidence":           round(max_prob, 4),
        "confidence_level":     confidence_level(max_prob),
        "predicted_score":      pred_score,
        "most_likely_score":    most_likely,
        "key_factors":          key_factors,
        "home_form_sequence":   h_form_sequence,
        "away_form_sequence":   a_form_sequence,
        "home_team_name":       home_team,
        "away_team_name":       away_team,
        "home_crest":           f"https://crests.football-data.org/{h_row['team_id']}.png",
        "away_crest":           f"https://crests.football-data.org/{a_row['team_id']}.png",
        "home_expected_goals":  round(home_expected_goals, 2),
        "away_expected_goals":  round(away_expected_goals, 2),
        "h2h_summary":          h2h if h2h else None,
        "top_scorelines":       scorelines[:8],
        "match_difficulty":     difficulty,
    }
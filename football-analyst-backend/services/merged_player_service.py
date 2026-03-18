"""
Merged Player Stats Service
Base: API-Football (photos, ratings, positions, defensive stats)
Enrichment: Understat (xG, xA, npxG)

Save as: services/merged_player_service.py
"""

import json
import os
import time
from difflib import SequenceMatcher

CACHE_DIR = "cache"

# API-Football cache files
API_FOOTBALL_FILES = {
    "Premier League":  "players_premier_league_2025.json",
    "La Liga":         "players_la_liga_2025.json",
    "Bundesliga":      "players_bundesliga_2025.json",
    "Serie A":         "players_serie_a_2025.json",
    "Ligue 1":         "players_ligue_1_2025.json",
    "Primeira Liga":   "players_primeira_liga_2025.json",
    "Champions League":"players_champions_league_2025.json",
}

UNDERSTAT_LEAGUES = {
    "Premier League":  "EPL",
    "La Liga":         "La_liga",
    "Bundesliga":      "Bundesliga",
    "Serie A":         "Serie_A",
    "Ligue 1":         "Ligue_1",
    "Primeira Liga":   "Primeira_Liga",
    "Champions League":"Champions_League",
}

TEAM_ALIASES = {
    # Premier League
    "wolverhampton wanderers": "wolves", "wolverhampton": "wolves",
    "tottenham hotspur": "tottenham", "spurs": "tottenham",
    "manchester united": "man utd", "man united": "man utd",
    "manchester city": "man city",
    "newcastle united": "newcastle",
    "nottingham forest": "nott'ham forest",
    "leicester city": "leicester",
    "west ham united": "west ham",
    "brighton and hove albion": "brighton", "brighton & hove albion": "brighton",
    # La Liga
    "athletic club": "athletic bilbao", "athletic": "athletic bilbao",
    "atletico madrid": "atletico", "atlético de madrid": "atletico",
    "real betis balompié": "real betis", "betis": "real betis",
    "deportivo alavés": "alaves", "alavés": "alaves",
    "rayo vallecano de madrid": "rayo vallecano",
    "real sociedad de fútbol": "real sociedad",
    # Bundesliga
    "bayern münchen": "bayern munich", "fc bayern münchen": "bayern munich",
    "borussia m.gladbach": "monchengladbach", "borussia mönchengladbach": "monchengladbach",
    "bayer 04 leverkusen": "bayer leverkusen", "leverkusen": "bayer leverkusen",
    "1. fc heidenheim 1846": "heidenheim", "1. fc heidenheim": "heidenheim",
    "1. fc union berlin": "union berlin",
    "1. fsv mainz 05": "mainz", "mainz 05": "mainz",
    "vfb stuttgart": "stuttgart",
    "vfl wolfsburg": "wolfsburg",
    "sv werder bremen": "werder bremen",
    "fc st. pauli 1910": "st. pauli", "fc st. pauli": "st. pauli",
    "1. fc köln": "koln", "fc köln": "koln",
    "tsg 1899 hoffenheim": "hoffenheim",
    # Serie A
    "internazionale": "inter", "inter milan": "inter", "fc internazionale": "inter",
    "ac milan": "milan",
    "ssc napoli": "napoli",
    "as roma": "roma",
    "ss lazio": "lazio",
    "acf fiorentina": "fiorentina",
    "uc sampdoria": "sampdoria",
    "us lecce": "lecce",
    "us cremonese": "cremonese",
    "hellas verona": "verona",
    # Ligue 1
    "paris saint-germain": "psg", "paris saint germain": "psg",
    "olympique de marseille": "marseille", "om": "marseille",
    "olympique lyonnais": "lyon", "ol": "lyon",
    "as monaco": "monaco",
    "losc lille": "lille", "losc": "lille",
    "rc strasbourg alsace": "strasbourg",
    "stade rennais fc 1901": "rennes", "stade rennais": "rennes",
    "fc nantes": "nantes",
    "ogc nice": "nice",
    "rc lens": "lens",
    "stade brestois 29": "brest",
    "toulouse fc": "toulouse",
    "montpellier hsc": "montpellier",
}

# ── helpers ─────────────────────────────────────────────────────────

def _safe_str(val):
    """Return val as string, or '' if None."""
    return val if isinstance(val, str) else ""


def _normalize_team(team):
    if not team:
        return ""
    t = _safe_str(team).lower().strip()
    for suffix in [" fc", " cf", " sc", " ac", " ssc", " afc", " bfc"]:
        t = t.replace(suffix, "")
    t = t.strip()
    return TEAM_ALIASES.get(t, t)


def _normalize_name(name):
    if not name:
        return ""
    n = _safe_str(name).lower().strip()
    replacements = {
        "á":"a","à":"a","ä":"a","â":"a","ã":"a",
        "é":"e","è":"e","ë":"e","ê":"e",
        "í":"i","ì":"i","ï":"i","î":"i",
        "ó":"o","ò":"o","ö":"o","ô":"o","õ":"o",
        "ú":"u","ù":"u","ü":"u","û":"u",
        "ñ":"n","ç":"c","ß":"ss",
        "ø":"o","å":"a","æ":"ae",
    }
    for k, v in replacements.items():
        n = n.replace(k, v)
    n = n.replace(".", "").replace("-", " ")
    return n.strip()


def _name_similarity(name1, name2):
    n1 = _normalize_name(name1)
    n2 = _normalize_name(name2)
    if n1 == n2:
        return 1.0
    parts1 = n1.split()
    parts2 = n2.split()
    if parts1 and parts2 and parts1[-1] == parts2[-1]:
        if len(parts1) > 1 and len(parts2) > 1:
            if parts1[0] == parts2[0]:
                return 0.95
            if parts1[0] and parts2[0] and parts1[0][0] == parts2[0][0]:
                return 0.85
        return 0.7
    return SequenceMatcher(None, n1, n2).ratio()


# ── data loaders ────────────────────────────────────────────────────

def _load_api_football(league=None):
    players = []
    files = (
        {league: API_FOOTBALL_FILES[league]}
        if league and league in API_FOOTBALL_FILES
        else API_FOOTBALL_FILES
    )
    for lg, fname in files.items():
        path = os.path.join(CACHE_DIR, fname)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for p in data:
                    p["league"] = lg
                players.extend(data)
    return players


def _load_understat(league=None):
    try:
        from services.player_scraper import fetch_all_players, fetch_league_players
        if league:
            return fetch_league_players(league)
        return fetch_all_players()
    except Exception as e:
        print(f"[MergedService] Understat load failed: {e}")
        return []


# ── main merge ──────────────────────────────────────────────────────

def get_merged_players(league=None):
    cache_key  = f"merged_{league or 'all'}"
    cache_path = os.path.join(CACHE_DIR, f"{cache_key}.json")

    if os.path.exists(cache_path):
        age = time.time() - os.path.getmtime(cache_path)
        if age < 3600:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)

    api_players       = _load_api_football(league)
    understat_players = _load_understat(league)

    # Understat lookup by (name, team)
    us_lookup  = {}
    us_by_name = {}
    for p in understat_players:
        key = (_normalize_name(p.get("name")), _normalize_team(p.get("team")))
        us_lookup[key] = p
        n = _normalize_name(p.get("name"))
        if n:
            us_by_name.setdefault(n, []).append(p)

    merged        = []
    matched_count = 0

    for ap in api_players:
        # FIX: use _safe_str so None values from JSON don't cause .lower() crashes
        player = {
            "id":               ap.get("id"),
            "name":             _safe_str(ap.get("name")),
            "firstName":        _safe_str(ap.get("firstName")),
            "lastName":         _safe_str(ap.get("lastName")),
            "age":              ap.get("age") or 0,
            "nationality":      _safe_str(ap.get("nationality")),
            "height":           _safe_str(ap.get("height")),
            "weight":           _safe_str(ap.get("weight")),
            "photo":            _safe_str(ap.get("photo")),
            "team":             _safe_str(ap.get("team")),
            "teamLogo":         _safe_str(ap.get("teamLogo")),
            "league":           _safe_str(ap.get("league")),
            "position":         _safe_str(ap.get("position")),
            "rating":           ap.get("rating") or 0,
            "appearances":      ap.get("appearances") or 0,
            "lineups":          ap.get("lineups") or 0,
            "minutes":          ap.get("minutes") or 0,
            "minsPerGame":      ap.get("minsPerGame") or 0,
            "goals":            ap.get("goals") or 0,
            "assists":          ap.get("assists") or 0,
            "shotsTotal":       ap.get("shotsTotal") or 0,
            "shotsOnTarget":    ap.get("shotsOnTarget") or 0,
            "shotAccuracy":     ap.get("shotAccuracy") or 0,
            "passesTotal":      ap.get("passesTotal") or 0,
            "keyPasses":        ap.get("keyPasses") or 0,
            "passAccuracy":     ap.get("passAccuracy") or 0,
            "tacklesTotal":     ap.get("tacklesTotal") or 0,
            "blocks":           ap.get("blocks") or 0,
            "interceptions":    ap.get("interceptions") or 0,
            "duelsTotal":       ap.get("duelsTotal") or 0,
            "duelsWon":         ap.get("duelsWon") or 0,
            "duelWinPct":       ap.get("duelWinPct") or 0,
            "dribblesAttempted":ap.get("dribblesAttempted") or 0,
            "dribblesSuccessful":ap.get("dribblesSuccessful") or 0,
            "dribbleSuccessPct":ap.get("dribbleSuccessPct") or 0,
            "dribbledPast":     ap.get("dribbledPast") or 0,
            "foulsDrawn":       ap.get("foulsDrawn") or 0,
            "foulsCommitted":   ap.get("foulsCommitted") or 0,
            "yellowCards":      ap.get("yellowCards") or 0,
            "redCards":         ap.get("redCards") or 0,
            "penaltiesWon":     ap.get("penaltiesWon") or 0,
            "penaltiesScored":  ap.get("penaltiesScored") or 0,
            "penaltiesMissed":  ap.get("penaltiesMissed") or 0,
            "penaltiesSaved":   ap.get("penaltiesSaved") or 0,
            "goalsConceded":    ap.get("goalsConceded") or 0,
            "saves":            ap.get("saves") or 0,
            "goalsPerNinety":   ap.get("goalsPerNinety") or 0,
            "assistsPerNinety": ap.get("assistsPerNinety") or 0,
            "tacklesPerNinety": ap.get("tacklesPerNinety") or 0,
            "duelsPerNinety":   ap.get("duelsPerNinety") or 0,
            # Understat defaults
            "xG": 0, "xA": 0, "npxG": 0, "xGPerNinety": 0,
        }

        ap_name_norm = _normalize_name(ap.get("name"))
        ap_team_norm = _normalize_team(ap.get("team"))

        # Method 1: exact name + team
        us_match = us_lookup.get((ap_name_norm, ap_team_norm))

        # Method 2: exact name, same team or same league
        if not us_match and ap_name_norm in us_by_name:
            for c in us_by_name[ap_name_norm]:
                if _normalize_team(c.get("team")) == ap_team_norm:
                    us_match = c
                    break
            if not us_match:
                for c in us_by_name[ap_name_norm]:
                    if c.get("league") == ap.get("league"):
                        us_match = c
                        break

        # Method 3: fuzzy name, same team
        if not us_match:
            best_sim = 0
            best_candidate = None
            for up in understat_players:
                if up.get("league") != ap.get("league"):
                    continue
                if _normalize_team(up.get("team")) != ap_team_norm:
                    continue
                sim = _name_similarity(ap.get("name"), up.get("name"))
                if sim > best_sim and sim >= 0.75:
                    best_sim = sim
                    best_candidate = up
            us_match = best_candidate

        if us_match:
            matched_count += 1
            player["xG"]         = round(us_match.get("xG") or 0, 2)
            player["xA"]         = round(us_match.get("xA") or 0, 2)
            player["npxG"]       = round(us_match.get("npxG") or 0, 2)
            player["xGPerNinety"]= round(us_match.get("xGPerNinety") or 0, 3)
            if not player["passAccuracy"] and us_match.get("passCompletion"):
                player["passAccuracy"] = us_match["passCompletion"]

        mins = player["minutes"]
        if mins and mins > 0:
            nineties = mins / 90
            player["gaPer90"] = round((player["goals"] + player["assists"]) / nineties, 2)
        else:
            player["gaPer90"] = 0

        merged.append(player)

    # Deduplicate by ID
    seen_ids     = set()
    unique_merged = []
    for p in merged:
        pid = p.get("id")
        if pid and pid in seen_ids:
            continue
        if pid:
            seen_ids.add(pid)
        unique_merged.append(p)
    merged = unique_merged

    print(f"[MergedService] {len(merged)} players, {matched_count} matched with Understat")

    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(merged, f)
    except Exception as e:
        print(f"[MergedService] Cache write failed: {e}")

    return merged


# ── search ──────────────────────────────────────────────────────────

def search_merged_players(query="", league=None, position=None, limit=20):
    """Search merged players by name, team, or position."""
    players     = get_merged_players(league)
    query_lower = (query or "").lower().strip()

    results = []
    for p in players:
        if position and _safe_str(p.get("position")) != position:
            continue
        if query_lower:
            # FIX: use _safe_str so None name/team never cause .lower() crash
            name_match = query_lower in _safe_str(p.get("name")).lower()
            team_match = query_lower in _safe_str(p.get("team")).lower()
            if not (name_match or team_match):
                continue
        results.append(p)

    results.sort(key=lambda x: x.get("rating") or 0, reverse=True)
    return results[:limit]


# ── team xG aggregation ─────────────────────────────────────────────

def get_team_xg_from_cache(team_name, league):
    """Aggregate player xG into team xG stats."""
    players = get_merged_players(league)
    tl = _safe_str(team_name).lower()
    squad = [
        p for p in players
        if tl in _safe_str(p.get("team")).lower()
        or _safe_str(p.get("team")).lower() in tl
    ]
    if not squad:
        return None

    total_xg = sum(float(p.get("xG") or 0) for p in squad)
    played   = max(max((p.get("appearances") or 0 for p in squad), default=1), 1)

    return {
        "xg_per_game":        round(total_xg / played, 3),
        "xga_per_game":       0,
        "xg_diff_per_game":   round(total_xg / played, 3),
        "xg_overperformance": 0,
        "home_xg_pg":         round(total_xg / played, 3),
        "home_xga_pg":        0,
        "home_win_rate":      0,
        "away_xg_pg":         round(total_xg / played * 0.9, 3),
        "away_xga_pg":        0,
        "away_win_rate":      0,
        "form_xg_pg":         round(total_xg / played, 3),
    }
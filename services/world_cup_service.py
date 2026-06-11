"""
World Cup Service — FIFA World Cup 2026 data from API-Football.
League id 1, season 2026. Self-contained and additive: does not touch any existing service.
Save as: football-analyst-backend/services/world_cup_service.py
"""

import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

API_KEY   = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL  = "https://v3.football.api-sports.io"
HEADERS   = {"x-apisports-key": API_KEY}
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

WC_LEAGUE_ID = 1
WC_SEASON    = 2026   # 2026 FIFA World Cup

LIVE_STATUSES = {"1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"}


def _get(endpoint, params=None):
    """API-Football GET with retry on rate limit (same pattern as live_scores_service)."""
    url = f"{BASE_URL}/{endpoint}"
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
            data = resp.json()
            if data.get("errors"):
                err = str(data["errors"])
                if "rateLimit" in err:
                    print("[WorldCup] Rate limited, waiting 60s...")
                    time.sleep(60)
                    continue
                print(f"[WorldCup] API error: {err}")
            return data
        except Exception as e:
            print(f"[WorldCup] Request failed: {e}")
            if attempt < 2:
                time.sleep(2)
    return {"response": []}


def _cache_path(name):
    return os.path.join(CACHE_DIR, f"wc_{name}.json")


def _read_cache(name, max_age_seconds):
    path = _cache_path(name)
    try:
        if os.path.exists(path) and (time.time() - os.path.getmtime(path)) < max_age_seconds:
            with open(path, "r") as f:
                return json.load(f)
    except Exception:
        return None
    return None


def _write_cache(name, data):
    try:
        with open(_cache_path(name), "w") as f:
            json.dump(data, f)
    except Exception:
        pass


def _norm_fixture(fx):
    fixture = fx.get("fixture", {}) or {}
    league  = fx.get("league", {}) or {}
    teams   = fx.get("teams", {}) or {}
    goals   = fx.get("goals", {}) or {}
    status  = fixture.get("status", {}) or {}
    home    = teams.get("home", {}) or {}
    away    = teams.get("away", {}) or {}
    rnd     = league.get("round", "") or ""
    return {
        "id": fixture.get("id"),
        "date": fixture.get("date"),
        "status": status.get("short", ""),
        "minute": status.get("elapsed"),
        "round": rnd,
        "stage": "group" if "group" in rnd.lower() else ("knockout" if rnd else ""),
        "venue": (fixture.get("venue", {}) or {}).get("name"),
        "homeTeam": home.get("name"),
        "homeLogo": home.get("logo"),
        "homeScore": goals.get("home"),
        "homeWin": home.get("winner"),
        "awayTeam": away.get("name"),
        "awayLogo": away.get("logo"),
        "awayScore": goals.get("away"),
        "awayWin": away.get("winner"),
    }


def get_wc_standings():
    """12 group tables. Returns [{group, table:[rows]}]."""
    cached = _read_cache("standings", 300)
    if cached is not None:
        return cached
    data = _get("standings", {"league": WC_LEAGUE_ID, "season": WC_SEASON})
    out = []
    try:
        resp = data.get("response") or []
        groups = resp[0].get("league", {}).get("standings", []) if resp else []
        for grp in groups:
            if not grp:
                continue
            gname = grp[0].get("group") or "Group"
            rows = []
            for r in grp:
                allp = r.get("all", {}) or {}
                team = r.get("team", {}) or {}
                rows.append({
                    "rank": r.get("rank"),
                    "team": team.get("name"),
                    "logo": team.get("logo"),
                    "played": allp.get("played"),
                    "win": allp.get("win"),
                    "draw": allp.get("draw"),
                    "lose": allp.get("lose"),
                    "gd": r.get("goalsDiff"),
                    "points": r.get("points"),
                    "form": r.get("form"),
                })
            out.append({"group": gname, "table": rows})
    except Exception as e:
        print(f"[WorldCup] standings parse error: {e}")
    _write_cache("standings", out)
    return out


def get_wc_fixtures(stage=None):
    """All fixtures, normalized and sorted by date. stage filter: 'group' | 'knockout'."""
    cached = _read_cache("fixtures", 120)
    if cached is None:
        data = _get("fixtures", {"league": WC_LEAGUE_ID, "season": WC_SEASON})
        cached = [_norm_fixture(fx) for fx in (data.get("response") or [])]
        cached.sort(key=lambda f: f.get("date") or "")
        _write_cache("fixtures", cached)
    if stage in ("group", "knockout"):
        return [f for f in cached if f.get("stage") == stage]
    return cached


def get_wc_live():
    """Only in-play World Cup matches."""
    cached = _read_cache("live", 30)
    if cached is not None:
        return cached
    data = _get("fixtures", {"league": WC_LEAGUE_ID, "season": WC_SEASON, "live": "all"})
    out = [_norm_fixture(fx) for fx in (data.get("response") or [])]
    _write_cache("live", out)
    return out


def get_wc_scorers():
    """Top scorers for the tournament."""
    cached = _read_cache("scorers", 600)
    if cached is not None:
        return cached
    data = _get("players/topscorers", {"league": WC_LEAGUE_ID, "season": WC_SEASON})
    out = []
    try:
        for item in (data.get("response") or [])[:25]:
            player = item.get("player", {}) or {}
            stats = (item.get("statistics") or [{}])[0] or {}
            goals = stats.get("goals", {}) or {}
            games = stats.get("games", {}) or {}
            team = stats.get("team", {}) or {}
            out.append({
                "name": player.get("name"),
                "photo": player.get("photo"),
                "team": team.get("name"),
                "teamLogo": team.get("logo"),
                "goals": goals.get("total"),
                "assists": goals.get("assists"),
                "apps": games.get("appearences"),
            })
    except Exception as e:
        print(f"[WorldCup] scorers parse error: {e}")
    _write_cache("scorers", out)
    return out

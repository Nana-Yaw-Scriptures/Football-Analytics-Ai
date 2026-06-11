"""
World Cup Service — FIFA World Cup 2026 data from API-Football.
League id 1, season 2026. Self-contained and additive: does not touch any existing service.
Save as: football-analyst-backend/services/world_cup_service.py
"""

import requests
import json
import os
import time
import math
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


def get_wc_assists():
    """Top assist providers for the tournament."""
    cached = _read_cache("assists", 600)
    if cached is not None:
        return cached
    data = _get("players/topassists", {"league": WC_LEAGUE_ID, "season": WC_SEASON})
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
                "assists": goals.get("assists"),
                "goals": goals.get("total"),
                "apps": games.get("appearences"),
            })
    except Exception as e:
        print(f"[WorldCup] assists parse error: {e}")
    _write_cache("assists", out)
    return out


# ══════════════════════════════════════════
# MATCH PREDICTIONS (national-team Poisson model)
# Not the club xG engine — built from recent national-team form only.
# ══════════════════════════════════════════

WC_BASELINE_GPG = 1.25   # avg goals per side in international football
_MAXG = 8                # scoreline grid cap


def _poisson_pmf(k, lam):
    try:
        return (lam ** k) * math.exp(-lam) / math.factorial(k)
    except Exception:
        return 0.0


def get_wc_teams():
    """name(lowercase) -> {id, name, logo} for the 48 teams. Cached 24h."""
    cached = _read_cache("teams", 86400)
    if cached is not None:
        return cached
    data = _get("teams", {"league": WC_LEAGUE_ID, "season": WC_SEASON})
    out = {}
    for item in (data.get("response") or []):
        t = item.get("team", {}) or {}
        name = t.get("name")
        if name:
            out[name.lower()] = {"id": t.get("id"), "name": name, "logo": t.get("logo")}
    _write_cache("teams", out)
    return out


def _team_form(team_id, last=10):
    """Average goals scored / conceded over a team's recent matches."""
    if not team_id:
        return None
    cached = _read_cache(f"form_{team_id}", 3600)
    if cached is not None:
        return cached
    data = _get("fixtures", {"team": team_id, "last": last})
    gf = ga = n = 0
    seq = []
    for fx in (data.get("response") or []):
        goals = fx.get("goals", {}) or {}
        teams = fx.get("teams", {}) or {}
        hg, ag = goals.get("home"), goals.get("away")
        if hg is None or ag is None:
            continue
        home_id = (teams.get("home", {}) or {}).get("id")
        if home_id == team_id:
            scored, conceded = hg, ag
        else:
            scored, conceded = ag, hg
        gf += scored; ga += conceded; n += 1
        seq.append("W" if scored > conceded else ("D" if scored == conceded else "L"))
    if n == 0:
        return None
    result = {"att": gf / n, "def": ga / n, "n": n, "form": list(reversed(seq[:5]))}
    _write_cache(f"form_{team_id}", result)
    return result


def _shrink(value, n, k=5):
    """Pull rates toward the baseline when a team has few recent games."""
    w = n / (n + k) if (n + k) else 0
    return w * value + (1 - w) * WC_BASELINE_GPG


def predict_wc_match(home_name, away_name):
    teams = get_wc_teams()
    h = teams.get((home_name or "").strip().lower())
    a = teams.get((away_name or "").strip().lower())
    if not h or not a:
        return {"error": "team_not_found", "home": home_name, "away": away_name}

    hf = _team_form(h["id"]) or {"att": WC_BASELINE_GPG, "def": WC_BASELINE_GPG, "n": 0}
    af = _team_form(a["id"]) or {"att": WC_BASELINE_GPG, "def": WC_BASELINE_GPG, "n": 0}

    h_att = _shrink(hf["att"], hf["n"]); h_def = _shrink(hf["def"], hf["n"])
    a_att = _shrink(af["att"], af["n"]); a_def = _shrink(af["def"], af["n"])

    # Expected goals: own attack blended with opponent's defensive concession
    lam_h = max(0.2, (h_att + a_def) / 2)
    lam_a = max(0.2, (a_att + h_def) / 2)

    ph = [_poisson_pmf(i, lam_h) for i in range(_MAXG + 1)]
    pa = [_poisson_pmf(j, lam_a) for j in range(_MAXG + 1)]

    p_home = p_draw = p_away = 0.0
    over25 = btts = 0.0
    scores = []
    for i in range(_MAXG + 1):
        for j in range(_MAXG + 1):
            p = ph[i] * pa[j]
            if i > j: p_home += p
            elif i == j: p_draw += p
            else: p_away += p
            if i + j >= 3: over25 += p
            if i >= 1 and j >= 1: btts += p
            scores.append((i, j, p))

    total = p_home + p_draw + p_away or 1.0
    scores.sort(key=lambda x: -x[2])

    ph_home, ph_draw, ph_away = p_home / total, p_draw / total, p_away / total
    topp = max(ph_home, ph_draw, ph_away)
    min_n = min(hf.get("n", 0), af.get("n", 0))
    conf = topp * (0.8 if min_n < 4 else 1.0)
    conf_val = round(conf * 100)
    level = "High" if conf_val >= 55 else ("Medium" if conf_val >= 40 else "Low")

    return {
        "home": {"name": h["name"], "logo": h["logo"]},
        "away": {"name": a["name"], "logo": a["logo"]},
        "expGoals": {"home": round(lam_h, 2), "away": round(lam_a, 2)},
        "prob": {
            "home": round(100 * ph_home, 1),
            "draw": round(100 * ph_draw, 1),
            "away": round(100 * ph_away, 1),
        },
        "doubleChance": {
            "home": round(100 * (ph_home + ph_draw), 1),
            "away": round(100 * (ph_away + ph_draw), 1),
        },
        "cleanSheet": {
            "home": round(100 * ph[0], 1),
            "away": round(100 * pa[0], 1),
        },
        "topScores": [{"score": f"{i}-{j}", "prob": round(100 * p, 1)} for i, j, p in scores[:3]],
        "over25": round(100 * over25, 1),
        "btts": round(100 * btts, 1),
        "form": {"home": hf.get("form", []), "away": af.get("form", [])},
        "confidence": {"level": level, "value": conf_val},
        "samples": {"home": hf["n"], "away": af["n"]},
    }
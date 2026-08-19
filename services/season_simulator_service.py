"""
Season Simulator Service — Final Version
Predicts final league standings by simulating all remaining fixtures.
Poisson model + Elo ratings + strict team name matching.
"""

import json, os, time, math, random, unicodedata
from datetime import datetime, timezone

CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

LEAGUE_CONFIG = {
    "Premier League": {"id": 39,  "teams": 20, "cl": 4, "el": 2, "relegation": 3},
    "La Liga":        {"id": 140, "teams": 20, "cl": 4, "el": 2, "relegation": 3},
    "Bundesliga":     {"id": 78,  "teams": 18, "cl": 4, "el": 2, "relegation": 3},
    "Serie A":        {"id": 135, "teams": 20, "cl": 4, "el": 2, "relegation": 3},
    "Ligue 1":        {"id": 61,  "teams": 18, "cl": 3, "el": 2, "relegation": 4},
    "Primeira Liga":  {"id": 94,  "teams": 18, "cl": 3, "el": 2, "relegation": 3},
}
from services.season import SEASON

def _read_cache(name, max_age=600):
    path = os.path.join(CACHE_DIR, f"{name}.json")
    if os.path.exists(path):
        if time.time() - os.path.getmtime(path) < max_age:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    return None

def _write_cache(name, data):
    with open(os.path.join(CACHE_DIR, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f)


# ══════════════════════════════════════════
# TEAM NAME MATCHING — collision-proof
# ══════════════════════════════════════════

def _norm(n):
    """Normalize: lowercase, strip accents."""
    return unicodedata.normalize('NFD', n.lower().strip()).encode('ascii', 'ignore').decode()

def _strip(n):
    """Strip common suffixes from normalized name."""
    for sfx in [' fc', ' afc', ' cf', ' sc', ' ac', ' ssc', ' ud',
                ' de futbol', ' de barcelona', ' de madrid', ' de vigo',
                ' balompie', ' 1910', ' 1846', ' 1899', ' 1901', ' 29']:
        n = n.replace(sfx, '')
    return n.strip()

# Strict alias map: normalized_input -> unique_substring_in_standings
TEAM_ALIASES = {
    # Premier League
    'wolves': 'wolverhampton', 'wolverhampton wanderers': 'wolverhampton',
    'tottenham hotspur': 'tottenham', 'spurs': 'tottenham',
    'manchester united': 'manchester united', 'manchester city': 'manchester city',
    'newcastle united': 'newcastle', 'brighton and hove albion': 'brighton',
    'brighton & hove albion': 'brighton', 'west ham united': 'west ham',
    'nottingham forest': 'nottingham', 'crystal palace': 'crystal palace',
    'afc bournemouth': 'bournemouth', 'sheffield united': 'sheffield',

    # La Liga
    'club atletico de madrid': 'atletico', 'atletico de madrid': 'atletico',
    'atletico madrid': 'atletico', 'athletic club': 'athletic',
    'athletic bilbao': 'athletic', 'real betis balompie': 'betis',
    'real betis': 'betis', 'rc celta de vigo': 'celta',
    'celta vigo': 'celta', 'rcd espanyol de barcelona': 'espanyol',
    'rcd espanyol': 'espanyol', 'ca osasuna': 'osasuna',
    'rayo vallecano de madrid': 'rayo vallecano', 'rcd mallorca': 'mallorca',
    'real sociedad de futbol': 'real sociedad', 'real sociedad': 'real sociedad',
    'deportivo alaves': 'alaves', 'cd leganes': 'leganes',
    'barcelona': 'fc barcelona', 'fc barcelona': 'fc barcelona',
    'real valladolid': 'valladolid', 'ud las palmas': 'las palmas',
    'levante ud': 'levante', 'real oviedo': 'oviedo',

    # Bundesliga — bayer != bayern
    'fc bayern munchen': 'bayern munchen', 'bayern munich': 'bayern munchen',
    'bayern munchen': 'bayern munchen', 'bayern': 'bayern munchen',
    'bayer 04 leverkusen': 'bayer 04', 'bayer leverkusen': 'bayer 04',
    'borussia dortmund': 'borussia dortmund',
    'borussia monchengladbach': 'monchengladbach',
    'vfb stuttgart': 'stuttgart', 'vfl wolfsburg': 'wolfsburg',
    'eintracht frankfurt': 'eintracht frankfurt', 'sc freiburg': 'freiburg',
    'rb leipzig': 'leipzig', '1. fsv mainz 05': 'mainz',
    'mainz 05': 'mainz', 'fc augsburg': 'augsburg',
    'tsg 1899 hoffenheim': 'hoffenheim', 'tsg hoffenheim': 'hoffenheim',
    'sv werder bremen': 'werder bremen', 'werder bremen': 'werder',
    '1. fc union berlin': 'union berlin', 'union berlin': 'union berlin',
    '1. fc heidenheim 1846': 'heidenheim', '1. fc heidenheim': 'heidenheim',
    'fc st. pauli 1910': 'st. pauli', 'fc st. pauli': 'st. pauli',
    'vfl bochum 1848': 'bochum', 'vfl bochum': 'bochum',
    '1. fc koln': 'koln', 'fc koln': 'koln',
    'holstein kiel': 'kiel', 'hamburger sv': 'hamburger',

    # Serie A
    'fc internazionale milano': 'internazionale', 'inter milan': 'internazionale',
    'ac milan': 'ac milan', 'ssc napoli': 'napoli', 'as roma': 'roma',
    'ss lazio': 'lazio', 'acf fiorentina': 'fiorentina',
    'us lecce': 'lecce', 'hellas verona': 'verona',
    'us sassuolo': 'sassuolo', 'us cremonese': 'cremonese',
    'uc sampdoria': 'sampdoria',

    # Ligue 1 — paris saint-germain != paris fc
    'paris saint-germain': 'paris saint-germain',
    'paris saint germain': 'paris saint-germain',
    'paris saint-germain fc': 'paris saint-germain',
    'psg': 'paris saint-germain',
    'paris fc': 'paris fc',
    'olympique de marseille': 'marseille', 'olympique marseille': 'marseille',
    'olympique lyonnais': 'lyonnais', 'olympique de lyon': 'lyonnais',
    'as monaco': 'monaco', 'as monaco fc': 'monaco',
    'lille osc': 'lille', 'losc lille': 'lille', 'losc': 'lille',
    'ogc nice': 'nice',
    'stade rennais fc 1901': 'rennais', 'stade rennais': 'rennais', 'rennes': 'rennais',
    'rc lens': 'lens', 'racing club de lens': 'lens',
    'rc strasbourg alsace': 'strasbourg',
    'fc nantes': 'nantes', 'toulouse fc': 'toulouse',
    'montpellier hsc': 'montpellier',
    'stade brestois 29': 'brestois', 'stade brestois': 'brestois', 'brest': 'brestois',
    'stade de reims': 'reims',
    'le havre ac': 'le havre',
    'aj auxerre': 'auxerre', 'angers sco': 'angers',
    'as saint-etienne': 'saint-etienne', 'saint-etienne': 'saint-etienne',
    'fc lorient': 'lorient', 'fc metz': 'metz',
}

def find_team(name, table):
    """Match fixture team name to standings team name. Collision-proof."""
    if name in table:
        return name

    nn = _norm(name)
    ns = _strip(nn)

    # 1. Exact normalized match
    for t in table:
        if _norm(t) == nn:
            return t

    # 2. Exact stripped match
    for t in table:
        if _strip(_norm(t)) == ns:
            return t

    # 3. Alias lookup (strict — no substring guessing)
    alias = TEAM_ALIASES.get(nn) or TEAM_ALIASES.get(ns)
    if alias:
        # Exact alias match first
        for t in table:
            tn = _norm(t)
            if alias == tn or alias == _strip(tn):
                return t
        # Alias as substring — only if unambiguous
        matches = [t for t in table if alias in _norm(t)]
        if len(matches) == 1:
            return matches[0]

    # 4. Last resort: longest distinctive word
    skip = {'club','real','racing','sporting','fc','cf','ac','sc','de','la','le','du',
            'des','el','los','ss','us','as','rc','cd','ud','sv','vfl','vfb','tsg',
            'fsv','rcd','ca','ogc','aj','1.','1'}
    words = [w for w in nn.split() if len(w) > 3 and w not in skip]
    if words:
        best = max(words, key=len)
        matches = [t for t in table if best in _norm(t)]
        if len(matches) == 1:
            return matches[0]

    print(f"[Simulator] WARNING: Could not match '{name}' to any team")
    return None


# ══════════════════════════════════════════
# POISSON MODEL + ELO RATINGS
# ══════════════════════════════════════════

def _poisson(lam, k):
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (lam ** k) * math.exp(-lam) / math.factorial(k)

def _build_ratings(table):
    teams = list(table.values())
    total_played = sum(t.get("played", 1) for t in teams)
    total_gf = sum(t.get("goalsFor", 0) for t in teams)
    avg_gpg = total_gf / max(total_played, 1)

    ratings = {}
    for t in teams:
        name = t.get("team", "")
        p = max(t.get("played", 1), 1)
        w, d, l = t.get("won", 0), t.get("drawn", 0), t.get("lost", 0)
        gf, ga = t.get("goalsFor", 0), t.get("goalsAgainst", 0)
        pts = t.get("points", 0)

        ppg = pts / p
        att = (gf / p) / max(avg_gpg, 0.5)
        dfn = (ga / p) / max(avg_gpg, 0.5)
        elo = 1500 + (ppg - 1.33) * 300
        form = (w * 3 + d) / (p * 3)

        ratings[name] = {
            "elo": elo, "ppg": ppg, "att": att, "dfn": dfn,
            "win_rate": w / p, "draw_rate": d / p, "loss_rate": l / p,
            "gf_pg": gf / p, "ga_pg": ga / p, "form": form,
        }
    return ratings

def quick_predict(home, away, table, ratings):
    """Advanced Poisson prediction with Elo, form, and historical pattern blending."""
    hr = ratings.get(home, {"elo":1500,"att":1,"dfn":1,"win_rate":.4,"draw_rate":.3,"loss_rate":.3,"form":.5})
    ar = ratings.get(away, {"elo":1500,"att":1,"dfn":1,"win_rate":.4,"draw_rate":.3,"loss_rate":.3,"form":.5})

    HOME_ADV = 1.20
    LEAGUE_AVG = 1.35

    # Expected goals
    hxg = hr["att"] * ar["dfn"] * LEAGUE_AVG * HOME_ADV
    axg = ar["att"] * hr["dfn"] * LEAGUE_AVG / HOME_ADV

    # Form adjustment ±15%
    hxg *= (0.85 + hr["form"] * 0.30)
    axg *= (0.85 + ar["form"] * 0.30)

    # Elo adjustment
    elo_diff = hr["elo"] - ar["elo"]
    ef = 1.0 + elo_diff / 2000
    hxg *= max(0.75, min(1.30, ef))
    axg *= max(0.75, min(1.30, 2.0 - ef))

    # Cap and add randomness
    hxg = max(0.4, min(3.5, hxg)) * (0.94 + random.random() * 0.12)
    axg = max(0.3, min(3.0, axg)) * (0.94 + random.random() * 0.12)

    # Poisson probabilities
    hw, dr, aw = 0.0, 0.0, 0.0
    sprobs = {}
    for hg in range(8):
        for ag in range(8):
            p = _poisson(hxg, hg) * _poisson(axg, ag)
            if hg == ag and hg <= 1:
                p *= 1.12  # boost low draws
            sprobs[(hg, ag)] = p
            if hg > ag: hw += p
            elif hg == ag: dr += p
            else: aw += p

    # Blend with historical W/D/L rates (25%)
    PW = 0.25
    hw = hw * (1-PW) + (hr["win_rate"] * 0.6 + ar["loss_rate"] * 0.4) * PW
    dr = dr * (1-PW) + (hr["draw_rate"] + ar["draw_rate"]) / 2 * PW
    aw = aw * (1-PW) + (ar["win_rate"] * 0.5 + hr["loss_rate"] * 0.5) * PW

    # Normalize
    t = hw + dr + aw
    hw, dr, aw = hw/t, dr/t, aw/t

    # Weighted random result
    roll = random.random()
    res = "H" if roll < hw else "D" if roll < hw + dr else "A"

    # Pick score
    if res == "H":
        pool = {k: v for k, v in sprobs.items() if k[0] > k[1]}
    elif res == "A":
        pool = {k: v for k, v in sprobs.items() if k[1] > k[0]}
    else:
        pool = {k: v for k, v in sprobs.items() if k[0] == k[1]}

    if pool:
        scores, weights = zip(*pool.items())
        sc = random.choices(scores, weights=weights, k=1)[0]
    else:
        sc = (1, 0) if res == "H" else (0, 1) if res == "A" else (1, 1)

    return {
        "home_win": round(hw, 3), "draw": round(dr, 3), "away_win": round(aw, 3),
        "home_expected_goals": round(hxg, 2), "away_expected_goals": round(axg, 2),
        "predicted_score": f"{sc[0]}-{sc[1]}", "result": res,
        "home_goals": sc[0], "away_goals": sc[1],
    }


# ══════════════════════════════════════════
# STANDINGS + FIXTURES
# ══════════════════════════════════════════

def get_current_standings(league):
    try:
        from services.data_fetcher import fetch_standings
        standings = fetch_standings(league)
        if standings is None or standings.empty:
            return []
        result = []
        for _, row in standings.iterrows():
            result.append({
                "position": int(row.get("position", 0)),
                "team": row.get("team", ""),
                "team_id": int(row.get("team_id", 0)) if "team_id" in row else 0,
                "played": int(row.get("played", row.get("playedGames", 0))),
                "won": int(row.get("won", 0)),
                "drawn": int(row.get("draw", row.get("drawn", 0))),
                "lost": int(row.get("lost", 0)),
                "goalsFor": int(row.get("goals_for", row.get("goalsFor", 0))),
                "goalsAgainst": int(row.get("goals_against", row.get("goalsAgainst", 0))),
                "goalDifference": int(row.get("goal_diff", row.get("goalDifference", 0))),
                "points": int(row.get("points", 0)),
                "form": row.get("form", ""),
            })
        return sorted(result, key=lambda x: (-x["points"], -x["goalDifference"], -x["goalsFor"]))
    except Exception as e:
        print(f"[Simulator] Failed to get standings: {e}")
        return []

def get_remaining_fixtures(league):
    import requests
    from dotenv import load_dotenv
    load_dotenv()
    API_KEY = os.getenv("API_FOOTBALL_KEY", "")
    config = LEAGUE_CONFIG.get(league)
    if not config:
        return []
    cache_name = f"remaining_fixtures_{league.replace(' ', '_').lower()}"
    cached = _read_cache(cache_name, max_age=3600)
    if cached is not None:
        return cached
    try:
        resp = requests.get(
            "https://v3.football.api-sports.io/fixtures",
            headers={"x-apisports-key": API_KEY},
            params={"league": config["id"], "season": SEASON, "status": "NS-TBD-PST"},
            timeout=15,
        )
        data = resp.json()
        fixtures = []
        for fix in data.get("response", []):
            fixture = fix.get("fixture", {})
            teams = fix.get("teams", {})
            fixtures.append({
                "id": fixture.get("id"),
                "date": fixture.get("date"),
                "homeTeam": teams.get("home", {}).get("name", ""),
                "awayTeam": teams.get("away", {}).get("name", ""),
                "round": fix.get("league", {}).get("round", ""),
            })
        _write_cache(cache_name, fixtures)
        return fixtures
    except Exception as e:
        print(f"[Simulator] Failed to get fixtures: {e}")
        return []


# ══════════════════════════════════════════
# MAIN SIMULATION — Monte Carlo 1,000 runs
# ══════════════════════════════════════════

N_RUNS = 1000  # Monte Carlo iterations

def _run_once(standings, remaining, config):
    """Single simulation run — returns final points table."""
    table = {}
    for team in standings:
        table[team["team"]] = {
            "team": team["team"],
            "points": team["points"],
            "played": team["played"],
            "won": team["won"], "drawn": team["drawn"], "lost": team["lost"],
            "goalsFor": team["goalsFor"], "goalsAgainst": team["goalsAgainst"],
        }
    ratings = _build_ratings(table)
    for fix in remaining:
        home = find_team(fix["homeTeam"], table)
        away = find_team(fix["awayTeam"], table)
        if not home or not away or home == away:
            continue
        try:
            pred = quick_predict(home, away, table, ratings)
            res, hg, ag = pred["result"], pred["home_goals"], pred["away_goals"]
            if res == "H":
                table[home]["won"]   += 1; table[home]["points"] += 3
                table[away]["lost"]  += 1
            elif res == "D":
                table[home]["drawn"] += 1; table[home]["points"] += 1
                table[away]["drawn"] += 1; table[away]["points"] += 1
            else:
                table[away]["won"]   += 1; table[away]["points"] += 3
                table[home]["lost"]  += 1
            table[home]["goalsFor"] += hg; table[home]["goalsAgainst"] += ag
            table[away]["goalsFor"] += ag; table[away]["goalsAgainst"] += hg
            table[home]["played"]   += 1;  table[away]["played"]       += 1
        except Exception:
            pass
    return table


def simulate_season(league):
    cache_name = f"simulation_{league.replace(' ', '_').lower()}"
    cached = _read_cache(cache_name, max_age=1800)
    if cached is not None:
        return cached

    config = LEAGUE_CONFIG.get(league)
    if not config:
        return {"error": f"League '{league}' not supported"}

    standings = get_current_standings(league)
    if not standings:
        return {"error": "Could not fetch standings"}

    remaining = get_remaining_fixtures(league)
    n_teams = config["teams"]

    # ── Monte Carlo: track position finishes + zone finishes ──────────
    team_names = [t["team"] for t in standings]
    pos_counts  = {t: [0] * n_teams for t in team_names}  # pos_counts[team][pos-1]
    zone_counts = {t: {"champions_league":0,"europa_league":0,"relegation":0,"mid_table":0}
                   for t in team_names}
    pts_runs    = {t: [] for t in team_names}

    skipped = []
    # Collect skipped from first run for reporting
    for fix in remaining:
        h = find_team(fix["homeTeam"], {t["team"]:t for t in standings})
        a = find_team(fix["awayTeam"], {t["team"]:t for t in standings})
        if not h or not a or h == a:
            skipped.append(f"{fix['homeTeam']} vs {fix['awayTeam']}")

    print(f"[Simulator] {league}: Running {N_RUNS} Monte Carlo iterations...")
    for run in range(N_RUNS):
        table = _run_once(standings, remaining, config)
        final = sorted(
            table.values(),
            key=lambda x: (-x["points"], -(x["goalsFor"]-x["goalsAgainst"]), -x["goalsFor"])
        )
        for pos, team in enumerate(final):
            name = team["team"]
            if name in pos_counts:
                pos_counts[name][pos] += 1
                pts_runs[name].append(team["points"])
                i = pos + 1
                if i <= config["cl"]:                     zone_counts[name]["champions_league"] += 1
                elif i <= config["cl"] + config["el"]:   zone_counts[name]["europa_league"]    += 1
                elif i > n_teams - config["relegation"]: zone_counts[name]["relegation"]        += 1
                else:                                     zone_counts[name]["mid_table"]         += 1

    # ── Build median table (most likely outcome) ──────────────────────
    median_table = _run_once(standings, remaining, config)
    final_median = sorted(
        median_table.values(),
        key=lambda x: (-x["points"], -(x["goalsFor"]-x["goalsAgainst"]), -x["goalsFor"])
    )

    # ── Attach probability data ───────────────────────────────────────
    predicted_table = []
    for i, team in enumerate(final_median):
        name = team["team"]
        pts_list = pts_runs.get(name, [team["points"]])
        pts_sorted = sorted(pts_list)
        pts_p10 = pts_sorted[int(len(pts_sorted)*0.10)] if pts_list else team["points"]
        pts_p90 = pts_sorted[int(len(pts_sorted)*0.90)] if pts_list else team["points"]
        pts_median = pts_sorted[len(pts_sorted)//2]     if pts_list else team["points"]
        pos_dist = pos_counts.get(name, [0]*n_teams)
        most_likely_pos = pos_dist.index(max(pos_dist)) + 1
        zc = zone_counts.get(name, {})
        src = next((s for s in standings if s["team"] == name), {})
        # Estimate simulated W/D/L from median points gain
        cur_pts  = src.get("points", 0)
        cur_p    = max(src.get("played", 1), 1)
        sim_pts  = pts_median - cur_pts
        sim_w    = round(sim_pts / 3 * 0.7)
        sim_d    = round((sim_pts - sim_w * 3) / 1) if sim_pts > sim_w * 3 else 0
        sim_l    = max(0, len(remaining) // max(len(standings),1) - sim_w - sim_d)
        total_p  = src.get("played", 0) + sim_w + sim_d + sim_l
        total_w  = src.get("won",   0) + sim_w
        total_d  = src.get("drawn", 0) + sim_d
        total_l  = src.get("lost",  0) + sim_l

        predicted_table.append({
            "team":              name,
            "currentPosition":   src.get("position", i+1),
            "currentPoints":     src.get("points", 0),
            "currentPlayed":     src.get("played", 0),
            "currentWon":        src.get("won", 0),
            "currentDrawn":      src.get("drawn", 0),
            "currentLost":       src.get("lost", 0),
            "currentGF":         src.get("goalsFor", 0),
            "currentGA":         src.get("goalsAgainst", 0),
            "currentGD":         src.get("goalDifference", 0),
            "predictedPosition": most_likely_pos,
            "medianPoints":      pts_median,
            "points":            pts_median,   # alias for frontend compat
            "played":            total_p,
            "won":               total_w,
            "drawn":             total_d,
            "lost":              total_l,
            "simPoints":         pts_median - src.get("points", 0),
            "simWins":           sim_w,
            "simDraws":          sim_d,
            "simLosses":         sim_l,
            "pointsP10":         pts_p10,
            "pointsP90":         pts_p90,
            "positionChange":    src.get("position", i+1) - most_likely_pos,
            "goalDifference":    team["goalsFor"] - team["goalsAgainst"],
            # Zone probabilities (%)
            "clProb":            round(zc.get("champions_league", 0) / N_RUNS * 100, 1),
            "elProb":            round(zc.get("europa_league",    0) / N_RUNS * 100, 1),
            "relegationProb":    round(zc.get("relegation",       0) / N_RUNS * 100, 1),
            # Zone based on most likely finish
            "zone": (
                "champions_league" if most_likely_pos <= config["cl"] else
                "europa_league"    if most_likely_pos <= config["cl"] + config["el"] else
                "relegation"       if most_likely_pos > n_teams - config["relegation"] else
                "mid_table"
            ),
            # Position distribution (top 5 most likely positions)
            "posDistribution": sorted(
                [{"pos": p+1, "pct": round(c/N_RUNS*100,1)} for p,c in enumerate(pos_dist) if c > 0],
                key=lambda x: -x["pct"]
            )[:5],
        })

    # ── Sample simulated matches from last run for display ────────────
    simulated_sample = []
    last_table_raw = {t["team"]: t.copy() for t in standings}
    ratings = _build_ratings({t["team"]: t for t in standings})
    for fix in remaining[:40]:  # show first 40 for UI
        home = find_team(fix["homeTeam"], last_table_raw)
        away = find_team(fix["awayTeam"], last_table_raw)
        if not home or not away or home == away:
            continue
        try:
            pred = quick_predict(home, away, last_table_raw, ratings)
            simulated_sample.append({
                "homeTeam": home, "awayTeam": away,
                "homeWinProb": pred["home_win"], "drawProb": pred["draw"], "awayWinProb": pred["away_win"],
                "predictedResult": pred["result"], "predictedScore": pred["predicted_score"],
                "round": fix.get("round",""), "date": fix.get("date",""),
            })
        except Exception:
            pass

    result = {
        "league": league, "config": config,
        "monteCarlo": {"runs": N_RUNS},
        "currentStandings": standings,
        "predictedTable": sorted(predicted_table, key=lambda x: x["predictedPosition"]),
        "simulatedMatches": simulated_sample,
        "totalRemaining": len(remaining), "totalSimulated": len(simulated_sample),
        "skippedMatches": skipped[:10],
        "simulatedAt": datetime.now(timezone.utc).isoformat(),
    }

    print(f"[Simulator] {league}: Done. {N_RUNS} runs × {len(remaining)} fixtures.")
    _write_cache(cache_name, result)
    return result
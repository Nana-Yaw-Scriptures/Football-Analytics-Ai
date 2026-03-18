import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv

load_dotenv()

API_KEY  = os.getenv("FOOTBALL_DATA_API_KEY")
BASE_URL = "https://api.football-data.org/v4"
HEADERS  = {"X-Auth-Token": API_KEY} if API_KEY else {}

LEAGUE_CODES = {
    "Premier League":  "PL",
    "La Liga":         "PD",
    "Bundesliga":      "BL1",
    "Serie A":         "SA",
    "Ligue 1":         "FL1",
    "Primeira Liga":   "PPL",
    "Champions League":"CL",
}

# ═══ TTL Cache ═══
# Standings: expensive call, changes slowly — cache 1 hour
# Recent matches: per-team, changes after each gameweek — cache 30 min
_standings_cache      = {}   # { league: (fetched_at, DataFrame) }
_recent_matches_cache = {}   # { team_id: (fetched_at, list) }

STANDINGS_TTL      = 3600   # seconds — 1 hour
RECENT_MATCHES_TTL = 1800   # seconds — 30 minutes


def _get(endpoint, params=None):
    url  = f"{BASE_URL}/{endpoint}"
    resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
    if resp.status_code == 429:
        time.sleep(60)
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def fetch_teams(league):
    import json
    cache_path = os.path.join(os.path.dirname(__file__), '..', 'cache', 'teams_cache.json')
    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            cached = json.load(f)
        if league in cached:
            return cached[league]
    except Exception:
        pass
    code = LEAGUE_CODES.get(league, "PL")
    data = _get(f"competitions/{code}/teams")
    return [
        {"id": t["id"], "name": t["name"], "crest": t.get("crest", "")}
        for t in data.get("teams", [])
    ]


def fetch_matches(league, status="FINISHED", limit=100, season=None):
    code   = LEAGUE_CODES.get(league, "PL")
    params = {"status": status, "limit": limit}
    if season:
        params["season"] = season
    data = _get(f"competitions/{code}/matches", params)
    rows = []
    for m in data.get("matches", []):
        score = m.get("score", {})
        ft    = score.get("fullTime", {})
        rows.append({
            "match_id":  m["id"],
            "date":      m["utcDate"],
            "home_team": m["homeTeam"]["name"],
            "home_id":   m["homeTeam"]["id"],
            "away_team": m["awayTeam"]["name"],
            "away_id":   m["awayTeam"]["id"],
            "home_goals":ft.get("home"),
            "away_goals":ft.get("away"),
            "winner":    m.get("score", {}).get("winner"),
            "matchday":  m.get("matchday"),
        })
    return pd.DataFrame(rows)


def fetch_standings(league, season=None):
    """
    Fetch standings with 1-hour in-memory TTL cache.
    This is the single biggest speed win — standings are fetched on
    every prediction without caching, causing ~3-5s latency per call.
    """
    cache_key = f"{league}:{season or 'current'}"
    now       = time.time()

    if cache_key in _standings_cache:
        fetched_at, cached_df = _standings_cache[cache_key]
        if now - fetched_at < STANDINGS_TTL:
            return cached_df

    # Cache miss or expired — fetch fresh
    code   = LEAGUE_CODES.get(league, "PL")
    params = {}
    if season:
        params["season"] = season
    data = _get(f"competitions/{code}/standings", params)

    rows = []
    for entry in data["standings"][0]["table"]:
        rows.append({
            "position":      entry["position"],
            "team":          entry["team"]["name"],
            "team_id":       entry["team"]["id"],
            "played":        entry["playedGames"],
            "won":           entry["won"],
            "draw":          entry["draw"],
            "lost":          entry["lost"],
            "goals_for":     entry["goalsFor"],
            "goals_against": entry["goalsAgainst"],
            "goal_diff":     entry["goalDifference"],
            "points":        entry["points"],
            "form":          entry.get("form", ""),
        })

    df = pd.DataFrame(rows)
    _standings_cache[cache_key] = (now, df)
    return df


def invalidate_standings_cache(league=None):
    """Force-expire standings cache. Pass league name or None to clear all."""
    if league:
        keys = [k for k in _standings_cache if k.startswith(f"{league}:")]
        for k in keys:
            del _standings_cache[k]
    else:
        _standings_cache.clear()


def fetch_team_recent_matches(team_id, limit=10):
    """
    Fetch recent matches with 30-minute TTL cache per team.
    Each prediction fetches recent matches for both teams — 2 API calls
    that now only hit the network once per 30 minutes per team.
    """
    cache_key = f"{team_id}:{limit}"
    now       = time.time()

    if cache_key in _recent_matches_cache:
        fetched_at, cached = _recent_matches_cache[cache_key]
        if now - fetched_at < RECENT_MATCHES_TTL:
            return cached

    try:
        data    = _get(f"teams/{team_id}/matches", {"status": "FINISHED", "limit": limit})
        matches = []
        for m in data.get("matches", []):
            ft      = m.get("score", {}).get("fullTime", {})
            is_home = m["homeTeam"]["id"] == team_id
            winner  = m.get("score", {}).get("winner")
            matches.append({
                "date":          m["utcDate"],
                "is_home":       is_home,
                "goals_for":     ft.get("home") if is_home else ft.get("away"),
                "goals_against": ft.get("away") if is_home else ft.get("home"),
                "winner":        winner,
                "result": (
                    "W" if (winner == "HOME_TEAM" and is_home) or (winner == "AWAY_TEAM" and not is_home)
                    else "L" if (winner == "AWAY_TEAM" and is_home) or (winner == "HOME_TEAM" and not is_home)
                    else "D"
                ),
            })
        _recent_matches_cache[cache_key] = (now, matches)
        return matches
    except Exception:
        return []


def calculate_momentum(recent_matches):
    if not recent_matches:
        return {
            "recent_ppg": 0, "recent_gpg": 0, "recent_gapg": 0,
            "win_streak": 0, "loss_streak": 0, "unbeaten_streak": 0,
            "recent_wins": 0, "recent_draws": 0, "recent_losses": 0,
            "recent_home_wr": 0, "recent_away_wr": 0,
            "recent_gd_pg": 0, "form_trend": 0,
        }

    n      = len(recent_matches)
    wins   = sum(1 for m in recent_matches if m["result"] == "W")
    draws  = sum(1 for m in recent_matches if m["result"] == "D")
    losses = sum(1 for m in recent_matches if m["result"] == "L")
    pts    = wins * 3 + draws
    gf     = sum(m["goals_for"]     or 0 for m in recent_matches)
    ga     = sum(m["goals_against"] or 0 for m in recent_matches)

    home_m     = [m for m in recent_matches if m["is_home"]]
    away_m     = [m for m in recent_matches if not m["is_home"]]
    home_wins  = sum(1 for m in home_m if m["result"] == "W")
    away_wins  = sum(1 for m in away_m if m["result"] == "W")

    win_streak = 0
    for m in reversed(recent_matches):
        if m["result"] == "W": win_streak += 1
        else: break

    loss_streak = 0
    for m in reversed(recent_matches):
        if m["result"] == "L": loss_streak += 1
        else: break

    unbeaten_streak = 0
    for m in reversed(recent_matches):
        if m["result"] != "L": unbeaten_streak += 1
        else: break

    if n >= 6:
        last3      = sum(3 if m["result"] == "W" else 1 if m["result"] == "D" else 0 for m in recent_matches[-3:])
        prev3      = sum(3 if m["result"] == "W" else 1 if m["result"] == "D" else 0 for m in recent_matches[-6:-3])
        form_trend = last3 - prev3
    else:
        form_trend = 0

    return {
        "recent_ppg":      round(pts / n, 3),
        "recent_gpg":      round(gf / n, 3),
        "recent_gapg":     round(ga / n, 3),
        "win_streak":      win_streak,
        "loss_streak":     loss_streak,
        "unbeaten_streak": unbeaten_streak,
        "recent_wins":     wins,
        "recent_draws":    draws,
        "recent_losses":   losses,
        "recent_home_wr":  round(home_wins / max(len(home_m), 1), 3),
        "recent_away_wr":  round(away_wins / max(len(away_m), 1), 3),
        "recent_gd_pg":    round((gf - ga) / n, 3),
        "form_trend":      form_trend,
    }


def fetch_team_stats(team_id):
    data = _get(f"teams/{team_id}")
    return {
        "name":  data["name"],
        "venue": data.get("venue", ""),
        "coach": data.get("coach", {}).get("name", "Unknown"),
        "squad": [
            {
                "name":          p["name"],
                "position":      p.get("position", "Unknown"),
                "nationality":   p.get("nationality", ""),
                "date_of_birth": p.get("dateOfBirth", ""),
            }
            for p in data.get("squad", [])
        ],
    }


def fetch_players(team):
    for league in LEAGUE_CODES:
        teams = fetch_teams(league)
        for t in teams:
            if team.lower() in t["name"].lower():
                stats = fetch_team_stats(t["id"])
                return stats["squad"]
    return []


def parse_form(form_str):
    if not form_str or not isinstance(form_str, str):
        return 0, 0, 0
    results = [r.strip() for r in form_str.replace(",", "") if r.strip() in ["W", "D", "L"]]
    points  = sum(3 if r == "W" else 1 if r == "D" else 0 for r in results)
    wins    = sum(1 for r in results if r == "W")
    losses  = sum(1 for r in results if r == "L")
    return points, wins, losses


def calculate_elo(standings_df):
    elo     = {}
    max_pts = standings_df["points"].max() if len(standings_df) > 0 else 1
    for _, row in standings_df.iterrows():
        rating  = 1500 + (row["points"] / max(max_pts, 1)) * 300
        rating += row["goal_diff"] * 3
        rating += (row["won"] - row["lost"]) * 5
        elo[row["team"]] = rating
    return elo


def build_match_features(home_team, away_team, league):
    standings = fetch_standings(league)

    home_row = standings[standings["team"].str.contains(home_team, case=False)]
    away_row = standings[standings["team"].str.contains(away_team, case=False)]

    if home_row.empty or away_row.empty:
        raise ValueError(f"Could not find teams in {league} standings")

    h = home_row.iloc[0]
    a = away_row.iloc[0]

    h_played = max(h["played"], 1)
    a_played = max(a["played"], 1)
    h_ppg    = h["points"] / h_played
    a_ppg    = a["points"] / a_played
    h_gpg    = h["goals_for"] / h_played
    a_gpg    = a["goals_for"] / a_played
    h_gapg   = h["goals_against"] / h_played
    a_gapg   = a["goals_against"] / a_played

    h_form_pts, h_form_wins, h_form_losses = parse_form(h.get("form", ""))
    a_form_pts, a_form_wins, a_form_losses = parse_form(a.get("form", ""))

    elo_ratings = calculate_elo(standings)
    h_elo = elo_ratings.get(h["team"], 1500)
    a_elo = elo_ratings.get(a["team"], 1500)

    from services.understat_scraper import scrape_league_xg, find_team_xg
    xg_data = {league: scrape_league_xg(league, "2025")}
    h_xg = find_team_xg(h["team"], league, xg_data)
    a_xg = find_team_xg(a["team"], league, xg_data)

    h_recent = fetch_team_recent_matches(h["team_id"], limit=8)
    a_recent = fetch_team_recent_matches(a["team_id"], limit=8)
    h_mom    = calculate_momentum(h_recent)
    a_mom    = calculate_momentum(a_recent)

    return {
        "home_position": h["position"], "away_position": a["position"],
        "home_points": h["points"],     "away_points": a["points"],
        "pos_diff": a["position"] - h["position"],
        "pts_diff": h["points"] - a["points"],
        "home_gf": h["goals_for"],  "home_ga": h["goals_against"],
        "away_gf": a["goals_for"],  "away_ga": a["goals_against"],
        "home_gd": h["goal_diff"],  "away_gd": a["goal_diff"],
        "gd_diff": h["goal_diff"] - a["goal_diff"],
        "home_wr": h["won"] / h_played, "away_wr": a["won"] / a_played,
        "home_dr": h["draw"] / h_played,"away_dr": a["draw"] / a_played,
        "home_lr": h["lost"] / h_played,"away_lr": a["lost"] / a_played,
        "wr_diff": (h["won"] / h_played) - (a["won"] / a_played),
        "home_ppg": h_ppg, "away_ppg": a_ppg, "ppg_diff": h_ppg - a_ppg,
        "home_gpg": h_gpg, "away_gpg": a_gpg, "gpg_diff": h_gpg - a_gpg,
        "home_gapg": h_gapg, "away_gapg": a_gapg,
        "home_attack_strength":  h_gpg / max(a_gapg, 0.1),
        "away_attack_strength":  a_gpg / max(h_gapg, 0.1),
        "home_defense_strength": a_gapg / max(h_gapg, 0.1),
        "away_defense_strength": h_gapg / max(a_gapg, 0.1),
        "overall_strength_ratio": h_ppg / max(a_ppg, 0.1),
        "home_elo": h_elo, "away_elo": a_elo, "elo_diff": h_elo - a_elo,
        "home_form_pts": h_form_pts,   "away_form_pts": a_form_pts,
        "form_pts_diff": h_form_pts - a_form_pts,
        "home_form_wins": h_form_wins, "away_form_wins": a_form_wins,
        "home_form_losses": h_form_losses, "away_form_losses": a_form_losses,
        "home_xg_pg":   h_xg["xg_per_game"]   if h_xg else h_gpg,
        "away_xg_pg":   a_xg["xg_per_game"]   if a_xg else a_gpg,
        "home_xga_pg":  h_xg["xga_per_game"]  if h_xg else h_gapg,
        "away_xga_pg":  a_xg["xga_per_game"]  if a_xg else a_gapg,
        "xg_diff": (h_xg["xg_diff_per_game"] if h_xg else 0) - (a_xg["xg_diff_per_game"] if a_xg else 0),
        "home_xg_overperf": h_xg["xg_overperformance"] if h_xg else 0,
        "away_xg_overperf": a_xg["xg_overperformance"] if a_xg else 0,
        "home_home_xg_pg":  h_xg["home_xg_pg"]  if h_xg else h_gpg,
        "away_away_xg_pg":  a_xg["away_xg_pg"]  if a_xg else a_gpg,
        "home_home_xga_pg": h_xg["home_xga_pg"] if h_xg else h_gapg,
        "away_away_xga_pg": a_xg["away_xga_pg"] if a_xg else a_gapg,
        "home_form_xg_pg":  h_xg["form_xg_pg"] if h_xg else 0,
        "away_form_xg_pg":  a_xg["form_xg_pg"] if a_xg else 0,
        "home_home_wr": h_xg["home_win_rate"] if h_xg else h["won"] / h_played,
        "away_away_wr": a_xg["away_win_rate"] if a_xg else a["won"] / a_played,
        "xg_attack_ratio":  (h_xg["home_xg_pg"] if h_xg else h_gpg)  / max((a_xg["away_xga_pg"] if a_xg else a_gapg), 0.1),
        "xg_defense_ratio": (a_xg["away_xg_pg"] if a_xg else a_gpg)  / max((h_xg["home_xga_pg"] if h_xg else h_gapg), 0.1),
        "home_recent_ppg":  h_mom["recent_ppg"],  "away_recent_ppg":  a_mom["recent_ppg"],
        "recent_ppg_diff":  h_mom["recent_ppg"] - a_mom["recent_ppg"],
        "home_recent_gpg":  h_mom["recent_gpg"],  "away_recent_gpg":  a_mom["recent_gpg"],
        "home_recent_gapg": h_mom["recent_gapg"], "away_recent_gapg": a_mom["recent_gapg"],
        "home_win_streak":  h_mom["win_streak"],  "away_win_streak":  a_mom["win_streak"],
        "home_loss_streak": h_mom["loss_streak"], "away_loss_streak": a_mom["loss_streak"],
        "home_unbeaten_streak": h_mom["unbeaten_streak"], "away_unbeaten_streak": a_mom["unbeaten_streak"],
        "home_recent_wins": h_mom["recent_wins"],   "away_recent_wins": a_mom["recent_wins"],
        "home_recent_losses": h_mom["recent_losses"],"away_recent_losses": a_mom["recent_losses"],
        "home_recent_home_wr": h_mom["recent_home_wr"], "away_recent_away_wr": a_mom["recent_away_wr"],
        "home_recent_gd_pg": h_mom["recent_gd_pg"],  "away_recent_gd_pg": a_mom["recent_gd_pg"],
        "home_form_trend": h_mom["form_trend"],       "away_form_trend": a_mom["form_trend"],
        "momentum_diff": h_mom["recent_ppg"] - a_mom["recent_ppg"],
        "trend_diff":    h_mom["form_trend"] - a_mom["form_trend"],
        "home_ppg_vs_recent": h_ppg - h_mom["recent_ppg"],
        "away_ppg_vs_recent": a_ppg - a_mom["recent_ppg"],
    }

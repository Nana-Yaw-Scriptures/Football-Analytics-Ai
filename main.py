from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import re
import requests
import time
from dotenv import load_dotenv

load_dotenv()

# ── API keys ──
API_KEY            = os.getenv("API_FOOTBALL_KEY", "")
FOOTBALL_DATA_KEY  = os.getenv("FOOTBALL_DATA_API_KEY", "")
API_BASE           = "https://v3.football.api-sports.io"
API_HEADERS        = {"x-apisports-key": API_KEY}
FDORG_BASE         = "https://api.football-data.org/v4"
FDORG_HEADERS      = {"X-Auth-Token": FOOTBALL_DATA_KEY}
SEASON             = 2025

app = FastAPI(title="Football Analyst AI - Backend")

FDORG_COMPETITION_IDS = {
    "Premier League":   "PL",
    "La Liga":          "PD",
    "Bundesliga":       "BL1",
    "Serie A":          "SA",
    "Ligue 1":          "FL1",
    "Primeira Liga":    "PPL",
    "Champions League": "CL",
}

_managers_cache: dict = {}
_managers_cache_ts: float = 0
MANAGERS_TTL = 3600

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── In-memory cache for teams ──
_teams_cache = {}

# ── API-Football league IDs (men's only) ──
API_FOOTBALL_LEAGUE_IDS = {
    "Premier League":       39,
    "La Liga":              140,
    "Bundesliga":           78,
    "Serie A":              135,
    "Ligue 1":              61,
    "Primeira Liga":        94,
    "Champions League":     2,
    "Championship":         40,
    "League One":           41,
    "League Two":           42,
    "2. Bundesliga":        79,
    "Serie B":              136,
    "Ligue 2":              62,
    "Eredivisie":           88,
    "Scottish Premiership": 179,
}


# ── normalize_team_name MUST be defined before _get_team_id_by_league ──
def normalize_team_name(name: str) -> str:
    """Strip common suffixes/prefixes and normalize for fuzzy matching"""
    name = name.lower().strip()
    name = name.replace('-', ' ')
    name = re.sub(r'\s+\d{4}$', '', name).strip()

    changed = True
    while changed:
        changed = False
        for suffix in [' fc', ' sc', ' afc', ' cf', ' ac', ' as', ' ss', ' sco', ' oc', ' fk', ' sk', ' if', ' bk']:
            if name.endswith(suffix):
                name = name[:-len(suffix)].strip()
                changed = True
                break

    for prefix in ['aj ', 'as ', 'ac ', 'ss ', 'fc ', 'rc ', 'og ']:
        if name.startswith(prefix):
            name = name[len(prefix):].strip()
            break

    aliases = {
        'paris saint germain':     'paris saint germain',
        'psg':                     'paris saint germain',
        'stade rennais':           'rennes',
        'racing club de lens':     'lens',
        'lens':                    'lens',
        'olympique de marseille':  'marseille',
        'olympique lyonnais':      'lyon',
        'as monaco':               'monaco',
        'monaco':                  'monaco',
        'rennais':                 'rennes',
        'rennes':                  'rennes',
        'wolverhampton wanderers': 'wolves',
        'wolverhampton':           'wolves',
        'brighton hove albion':    'brighton & hove albion',
        'nottingham forest':       'nottingham forest',
        'newcastle united':        'newcastle united',
        'tottenham hotspur':       'tottenham',
        'west ham united':         'west ham',
        'leicester city':          'leicester',
        'manchester united':       'man united',
        'manchester city':         'man city',
    }
    return aliases.get(name, name)


def _get_team_id_by_league(name: str, league: str):
    """
    Resolve a team ID by searching within the correct men's league.
    Uses the league ID to guarantee we never hit women's team results.
    """
    league_id = API_FOOTBALL_LEAGUE_IDS.get(league)
    if not league_id:
        return None
    name_norm = normalize_team_name(name)
    for season in [SEASON, 2024, 2023]:
        try:
            resp = requests.get(
                f"{API_BASE}/teams",
                headers=API_HEADERS,
                params={"league": league_id, "season": season},
                timeout=8,
            )
            data = resp.json()
            teams = data.get("response", [])

            # Pass 1: exact match
            for entry in teams:
                t_norm = normalize_team_name(entry["team"]["name"])
                if name_norm == t_norm:
                    return entry["team"]["id"]

            # Pass 2: Jaccard similarity
            best_id = None
            best_score = 0
            name_words = set(name_norm.split())
            for entry in teams:
                t_norm = normalize_team_name(entry["team"]["name"])
                t_words = set(t_norm.split())
                common = len(name_words & t_words)
                total = len(name_words | t_words)
                score = common / max(total, 1)
                if score > best_score:
                    best_score = score
                    best_id = entry["team"]["id"]

            if best_score > 0.3:
                return best_id

        except Exception as e:
            print(f"Team ID lookup error (season {season}): {e}")

    # Pass 3: fallback — use API-Football's own search endpoint
    # Handles cases like "Wolverhampton Wanderers" → API stores as "Wolves"
    try:
        # Use first significant word as search term
        search_term = name_norm.split()[0] if name_norm else name
        resp = requests.get(
            f"{API_BASE}/teams",
            headers=API_HEADERS,
            params={"search": search_term},
            timeout=8,
        )
        results = resp.json().get("response", [])
        # Filter to men's leagues only
        valid_league_ids = set(API_FOOTBALL_LEAGUE_IDS.values())
        for entry in results:
            # Check if this team plays in any of our known leagues
            team_id = entry["team"]["id"]
            t_norm = normalize_team_name(entry["team"]["name"])
            # Accept if first word of search matches first word of result
            if name_norm.split()[0] in t_norm or t_norm.split()[0] in name_norm:
                # Verify it's a men's team by checking league membership
                verify = requests.get(
                    f"{API_BASE}/teams",
                    headers=API_HEADERS,
                    params={"id": team_id, "league": league_id, "season": SEASON},
                    timeout=8,
                )
                if verify.json().get("response"):
                    return team_id
    except Exception as e:
        print(f"Team search fallback error: {e}")

    return None


# ── Models ──
models = {}

@app.on_event("startup")
def load_models():
    model_dir = "trained_models"
    if os.path.exists(model_dir):
        for f in os.listdir(model_dir):
            if f.endswith(".pkl"):
                name = f.replace(".pkl", "")
                models[name] = joblib.load(os.path.join(model_dir, f))
                print(f"Loaded model: {name}")


# ── Request/Response Schemas ──

class MatchPredictionRequest(BaseModel):
    home_team: str
    away_team: str
    league: str = "Premier League"

class MatchPredictionResponse(BaseModel):
    home_win: float
    draw: float
    away_win: float
    predicted_outcome: str
    confidence: float
    confidence_level: str = "Medium"
    predicted_score: str = ""
    most_likely_score: str = ""
    key_factors: list[str]
    home_form_sequence: list[str] = []
    away_form_sequence: list[str] = []
    home_team_name: str = ""
    away_team_name: str = ""
    home_crest: str = ""
    away_crest: str = ""
    home_expected_goals: float = 0.0
    away_expected_goals: float = 0.0
    top_scorelines: list = []
    match_difficulty: int = 5

from typing import Optional
h2h_summary: Optional[dict] = None

class PlayerRatingRequest(BaseModel):
    player_name: str
    league: str = "Premier League"

class PlayerRatingResponse(BaseModel):
    player_name: str
    overall_rating: float
    attacking: float
    defending: float
    passing: float
    physical: float
    strengths: list[str]
    weaknesses: list[str]

class ValueEstimateRequest(BaseModel):
    player_name: str
    age: int
    position: str
    league: str
    goals: int = 0
    assists: int = 0
    appearances: int = 0

class ValueEstimateResponse(BaseModel):
    player_name: str
    estimated_value_eur: float
    value_range_low: float
    value_range_high: float
    value_factors: list[str]


# ── Endpoints ──

@app.get("/")
def root():
    return {"status": "Football Analyst AI Backend is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": list(models.keys())}

@app.post("/predict/match", response_model=MatchPredictionResponse)
def predict_match(req: MatchPredictionRequest):
    try:
        from services.match_service import get_match_prediction
        return get_match_prediction(req, models.get("match_predictor"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/player")
def analyze_player(req: PlayerRatingRequest):
    try:
        from services.player_service import get_player_rating
        return get_player_rating(req, models.get("player_rater"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/estimate/value", response_model=ValueEstimateResponse)
def estimate_value(req: ValueEstimateRequest):
    try:
        from services.value_service import get_value_estimate
        return get_value_estimate(req, models.get("value_estimator"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/standings/{league}")
def get_standings(league: str):
    """Get league table standings using API-Football"""
    try:
        league_id = API_FOOTBALL_LEAGUE_IDS.get(league)
        if not league_id:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")

        resp = requests.get(
            f"{API_BASE}/standings",
            headers=API_HEADERS,
            params={"league": league_id, "season": SEASON},
            timeout=10,
        )
        data = resp.json().get("response", [])
        if not data:
            return []

        standings = data[0].get("league", {}).get("standings", [[]])[0]

        rows = []
        for entry in standings:
            team = entry.get("team", {})
            all_stats = entry.get("all", {})
            goals = all_stats.get("goals", {})
            rows.append({
                "position":      entry.get("rank"),
                "team":          team.get("name", ""),
                "team_id":       team.get("id"),
                "crest":         team.get("logo", ""),
                "played":        all_stats.get("played", 0),
                "won":           all_stats.get("win", 0),
                "draw":          all_stats.get("draw", 0),
                "lost":          all_stats.get("lose", 0),
                "goals_for":     goals.get("for", 0),
                "goals_against": goals.get("against", 0),
                "goal_diff":     entry.get("goalsDiff", 0),
                "points":        entry.get("points", 0),
                "form":          entry.get("form", ""),
            })

        return rows

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/teams/{league}")
def get_teams(league: str):
    from services.data_fetcher import fetch_teams
    if league not in _teams_cache:
        _teams_cache[league] = fetch_teams(league)
    return _teams_cache[league]


@app.get("/teams/refresh/{league}")
def refresh_teams_cache(league: str):
    from services.data_fetcher import fetch_teams
    _teams_cache[league] = fetch_teams(league)
    return {"refreshed": league, "count": len(_teams_cache[league])}


@app.get("/players/search")
def search_players(q: str = "", league: str = None, position: str = None, limit: int = 20):
    try:
        from services.merged_player_service import search_merged_players
        return search_merged_players(q, league, position, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/players/{team}")
def get_players(team: str):
    from services.data_fetcher import fetch_players
    return fetch_players(team)

@app.get("/players-stats/all")
def get_all_players_stats(league: str = None):
    try:
        from services.merged_player_service import get_merged_players
        return get_merged_players(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/players-stats/{league}")
def get_league_players_stats(league: str):
    try:
        from services.merged_player_service import get_merged_players
        return get_merged_players(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/player/{player_id}/matches")
def get_player_matches(player_id: int, season: int = SEASON):
    try:
        from services.player_detail_service import get_player_fixtures
        return get_player_fixtures(player_id, season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/player/{player_id}/percentiles")
def get_player_percentiles(player_id: int):
    try:
        from services.player_detail_service import get_player_league_percentiles
        data = get_player_league_percentiles(player_id)
        if not data:
            raise HTTPException(status_code=404, detail="Player not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/player/{player_id}")
def get_player_detail(player_id: int):
    try:
        from services.player_detail_service import get_player_from_cache
        player = get_player_from_cache(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return player
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/h2h/{home}/{away}")
def get_head_to_head(home: str, away: str, league: str = "Premier League"):
    try:
        home_id = _get_team_id_by_league(home, league)
        away_id = _get_team_id_by_league(away, league)

        if not home_id or not away_id:
            for lg in API_FOOTBALL_LEAGUE_IDS:
                if not home_id:
                    home_id = _get_team_id_by_league(home, lg)
                if not away_id:
                    away_id = _get_team_id_by_league(away, lg)
                if home_id and away_id:
                    break

        if not home_id or not away_id:
            return {"matches": [], "error": "Teams not found in men's leagues"}

        h2h_resp = requests.get(
            f"{API_BASE}/fixtures/headtohead",
            headers=API_HEADERS,
            params={"h2h": f"{home_id}-{away_id}", "last": 10},
            timeout=8,
        )
        fixtures = h2h_resp.json().get("response", [])

        matches = []
        for fix in fixtures:
            matches.append({
                "date":        fix["fixture"]["date"][:10],
                "competition": fix["league"]["name"],
                "round":       fix["league"].get("round", ""),
                "homeTeam":    fix["teams"]["home"]["name"],
                "awayTeam":    fix["teams"]["away"]["name"],
                "homeLogo":    fix["teams"]["home"]["logo"],
                "awayLogo":    fix["teams"]["away"]["logo"],
                "homeGoals":   fix["goals"]["home"],
                "awayGoals":   fix["goals"]["away"],
                "homeWinner":  fix["teams"]["home"].get("winner"),
            })

        return {"matches": matches, "homeId": home_id, "awayId": away_id}
    except Exception as e:
        print(f"H2H error: {e}")
        return {"matches": [], "error": str(e)}


@app.get("/team-fixtures")
def get_team_fixtures(team: str, last: int = 10, league: str = "Premier League"):
    try:
        team_id = _get_team_id_by_league(team, league)

        if not team_id:
            for lg in API_FOOTBALL_LEAGUE_IDS:
                team_id = _get_team_id_by_league(team, lg)
                if team_id:
                    break

        if not team_id:
            return {"fixtures": [], "error": "Team not found in men's leagues"}

        team_resp = requests.get(
            f"{API_BASE}/teams",
            headers=API_HEADERS,
            params={"id": team_id},
            timeout=8,
        )
        team_data = team_resp.json().get("response", [])
        team_name = team_data[0]["team"]["name"] if team_data else team
        team_logo = team_data[0]["team"]["logo"] if team_data else ""

        fix_resp = requests.get(
            f"{API_BASE}/fixtures",
            headers=API_HEADERS,
            params={"team": team_id, "last": last},
            timeout=8,
        )
        fixtures = fix_resp.json().get("response", [])

        matches = []
        for fix in fixtures:
            home = fix["teams"]["home"]
            away = fix["teams"]["away"]
            is_home = home["id"] == team_id
            opponent = away if is_home else home
            goals_for     = fix["goals"]["home"] if is_home else fix["goals"]["away"]
            goals_against = fix["goals"]["away"] if is_home else fix["goals"]["home"]

            if goals_for is None or goals_against is None:
                continue

            result = "W" if goals_for > goals_against else "D" if goals_for == goals_against else "L"
            matches.append({
                "date":         fix["fixture"]["date"][:10],
                "competition":  fix["league"]["name"],
                "round":        fix["league"].get("round", ""),
                "homeTeam":     home["name"],
                "awayTeam":     away["name"],
                "homeLogo":     home["logo"],
                "awayLogo":     away["logo"],
                "homeGoals":    fix["goals"]["home"],
                "awayGoals":    fix["goals"]["away"],
                "venue":        "Home" if is_home else "Away",
                "result":       result,
                "opponent":     opponent["name"],
                "opponentLogo": opponent["logo"],
            })

        form   = [m["result"] for m in matches[:10]]
        wins   = form.count("W")
        draws  = form.count("D")
        losses = form.count("L")

        return {
            "team":     team_name,
            "logo":     team_logo,
            "teamId":   team_id,
            "fixtures": matches,
            "form":     form,
            "summary":  {"wins": wins, "draws": draws, "losses": losses},
        }
    except Exception as e:
        return {"fixtures": [], "error": str(e)}


@app.get("/live/today")
def get_today_fixtures(league: str = None):
    try:
        from services.live_scores_service import get_todays_fixtures
        return get_todays_fixtures(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/live/now")
def get_live_now():
    try:
        from services.live_scores_service import get_live_fixtures
        return get_live_fixtures()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/live/fixture/{fixture_id}")
def get_fixture_details(fixture_id: int):
    try:
        from services.live_scores_service import get_fixture_detail
        result = get_fixture_detail(fixture_id)
        if not result:
            raise HTTPException(status_code=404, detail="Fixture not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/live/upcoming")
def get_upcoming(league: str = None, days: int = 7):
    try:
        from services.live_scores_service import get_upcoming_fixtures
        return get_upcoming_fixtures(league, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/simulate/{league}")
def simulate_season_endpoint(league: str, fresh: bool = False):
    try:
        from services.season_simulator_service import simulate_season
        if fresh:
            cache_path = os.path.join("cache", f"simulation_{league.replace(' ', '_').lower()}.json")
            if os.path.exists(cache_path):
                os.remove(cache_path)
        result = simulate_season(league)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predictions/save")
def save_prediction_endpoint(prediction: dict):
    try:
        from services.prediction_history_service import save_prediction
        return save_prediction(prediction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/history")
def get_predictions(limit: int = 50, league: str = None, resolved_only: bool = False):
    try:
        from services.prediction_history_service import get_history
        return get_history(limit, league, resolved_only)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/accuracy")
def get_accuracy(league: str = None):
    try:
        from services.prediction_history_service import get_accuracy_stats
        return get_accuracy_stats(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predictions/resolve")
def resolve_predictions_endpoint():
    try:
        from services.prediction_history_service import resolve_predictions
        return resolve_predictions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int):
    try:
        from services.prediction_history_service import _load_history, _save_history
        history = _load_history()
        new_history = [p for p in history if p.get("id") != prediction_id]
        if len(new_history) == len(history):
            raise HTTPException(status_code=404, detail="Prediction not found")
        _save_history(new_history)
        return {"deleted": prediction_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/predictions/clear")
def clear_predictions():
    try:
        from services.prediction_history_service import clear_history
        return clear_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predicted-scorers/{home}/{away}")
def get_predicted_scorers(home: str, away: str, league: str = "Premier League"):
    try:
        from services.merged_player_service import get_merged_players

        players = get_merged_players(league)
        if not players:
            return {"home": [], "away": []}

        def normalize(s):
            return (s.lower()
                .replace("fc ", "").replace(" fc", "")
                .replace("cf ", "").replace(" cf", "")
                .replace("afc ", "").replace(" afc", "")
                .replace("  ", " ").strip())

        def match_team(player_team: str, query: str) -> bool:
            pt = normalize(player_team)
            qt = normalize(query)
            return pt == qt or (len(qt) >= 5 and qt in pt) or (len(pt) >= 5 and pt in qt)

        def score_player(p):
            xg    = float(p.get("xG") or 0)
            g90   = float(p.get("goalsPerNinety") or 0)
            goals = int(p.get("goals") or 0)
            apps  = int(p.get("appearances") or 0)
            if apps < 3:
                return 0
            return (xg * 0.4) + (g90 * 0.4) + (goals / max(apps, 1) * 0.2)

        def score_to_probability(s):
            import math
            return round(min(85.0, max(5.0, 85 * (1 - math.exp(-s * 3)))), 1)

        home_squad = [p for p in players if match_team(p.get("team", ""), home)]
        away_squad = [p for p in players if match_team(p.get("team", ""), away)]

        def top_scorers(squad, n=3):
            scored = [(p, score_player(p)) for p in squad if score_player(p) > 0]
            scored.sort(key=lambda x: x[1], reverse=True)
            top = scored[:n]
            return [
                {
                    "name":             p.get("name", ""),
                    "photo":            p.get("photo", ""),
                    "team":             p.get("team", ""),
                    "teamLogo":         p.get("teamLogo", ""),
                    "position":         p.get("position", ""),
                    "goals":            p.get("goals", 0),
                    "xG":               round(float(p.get("xG") or 0), 2),
                    "goalsPerNinety":   round(float(p.get("goalsPerNinety") or 0), 2),
                    "scoreProbability": score_to_probability(s),
                }
                for p, s in top
            ]

        return {
            "home": top_scorers(home_squad),
            "away": top_scorers(away_squad),
        }

    except Exception as e:
        print(f"Scorers error: {e}")
        return {"home": [], "away": []}


@app.post("/cache/invalidate-standings")
def invalidate_standings(league: str = None):
    try:
        from services.data_fetcher import invalidate_standings_cache
        invalidate_standings_cache(league)
        return {"invalidated": league or "all"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/backtest/{league}")
def run_backtest(league: str):
    try:
        from services.match_service import backtest_against_results
        result = backtest_against_results(league)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/brier-score")
def compute_brier(predictions: list[dict] = None):
    try:
        from services.match_service import brier_score
        return brier_score(predictions or [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cache/invalidate-xg")
def invalidate_xg_cache(league: str = None):
    try:
        from services.match_service import _xg_cache, _team_league_cache
        if league:
            keys = [k for k in _xg_cache if k.startswith(f"{league}:")]
            for k in keys:
                del _xg_cache[k]
        else:
            _xg_cache.clear()
            _team_league_cache.clear()
        return {"invalidated": league or "all"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/league/results")
def get_league_results(league: str = "Premier League"):
    try:
        from services.data_fetcher import fetch_matches
        df = fetch_matches(league, status="FINISHED", limit=380)
        if df.empty:
            return []

        results = []
        for _, m in df.iterrows():
            results.append({
                "id":        int(m["match_id"]) if m.get("match_id") else None,
                "homeTeam":  m.get("home_team", ""),
                "awayTeam":  m.get("away_team", ""),
                "homeLogo":  f"https://crests.football-data.org/{int(m['home_id'])}.png" if m.get("home_id") else None,
                "awayLogo":  f"https://crests.football-data.org/{int(m['away_id'])}.png" if m.get("away_id") else None,
                "homeGoals": int(m["home_goals"]) if m.get("home_goals") is not None else None,
                "awayGoals": int(m["away_goals"]) if m.get("away_goals") is not None else None,
                "status":    "FT",
                "date":      str(m.get("date", "")),
                "round":     f"Matchday {int(m['matchday'])}" if m.get("matchday") else "Results",
            })

        results.sort(key=lambda x: x["date"], reverse=True)
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/match/events/{match_id}")
def get_match_events(match_id: int, home: str = "", away: str = "", date: str = ""):
    try:
        if not API_KEY:
            raise HTTPException(status_code=400, detail="API-Football key not configured")

        fixture_id = None
        fix = None

        for league_id in API_FOOTBALL_LEAGUE_IDS.values():
            resp = requests.get(
                f"{API_BASE}/fixtures",
                headers=API_HEADERS,
                params={"league": league_id, "season": SEASON, "date": date[:10]},
                timeout=8,
            )
            fixtures = resp.json().get("response", [])
            home_norm = normalize_team_name(home)
            away_norm = normalize_team_name(away)
            print(f"DEBUG league {league_id}: searching '{home_norm}' vs '{away_norm}' in {len(fixtures)} fixtures")
            for f in fixtures:
                h = normalize_team_name(f["teams"]["home"]["name"])
                a = normalize_team_name(f["teams"]["away"]["name"])
                if (home_norm in h or h in home_norm or
                    any(word in h for word in home_norm.split() if len(word) > 3)) and \
                   (away_norm in a or a in away_norm or
                    any(word in a for word in away_norm.split() if len(word) > 3)):
                    fix = f
                    fixture_id = f["fixture"]["id"]
                    break
            if fix:
                break

        if not fix:
            raise HTTPException(status_code=404, detail="Match not found in API-Football")

        home_id = fix["teams"]["home"]["id"]
        away_id = fix["teams"]["away"]["id"]

        def apifetch(endpoint, extra_params=None):
            try:
                params = {"fixture": fixture_id}
                if extra_params:
                    params.update(extra_params)
                r = requests.get(
                    f"{API_BASE}/{endpoint}",
                    headers=API_HEADERS,
                    params=params,
                    timeout=8,
                )
                return r.json().get("response", [])
            except Exception:
                return []

        events_data  = apifetch("fixtures/events")
        stats_data   = apifetch("fixtures/statistics")
        lineups_data = apifetch("fixtures/lineups")
        players_data = apifetch("fixtures/players")

        goals, bookings, subs = [], [], []
        for e in events_data:
            is_home = e["team"]["id"] == home_id
            minute  = e["time"]["elapsed"]
            etype   = e["type"]
            detail  = e["detail"]
            player  = (e.get("player") or {}).get("name", "")
            assist  = (e.get("assist") or {}).get("name", "")

            if etype == "Goal":
                goals.append({
                    "minute":   minute,
                    "scorer":   player,
                    "assist":   assist or None,
                    "team":     e["team"]["name"],
                    "isHome":   is_home,
                    "goalType": "OWN_GOAL" if detail == "Own Goal"
                                else "PENALTY" if detail == "Penalty"
                                else "REGULAR",
                })
            elif etype == "Card":
                bookings.append({
                    "minute": minute,
                    "player": player,
                    "team":   e["team"]["name"],
                    "isHome": is_home,
                    "card":   "RED" if "Red" in detail and "Yellow" not in detail
                              else "YELLOW_RED" if "Yellow Red" in detail
                              else "YELLOW",
                })
            elif etype == "subst":
                subs.append({
                    "minute":    minute,
                    "playerIn":  player,
                    "playerOut": assist,
                    "team":      e["team"]["name"],
                    "isHome":    is_home,
                })

        stats = {}
        for team_stats in stats_data:
            side = "home" if team_stats["team"]["id"] == home_id else "away"
            for s in team_stats.get("statistics", []):
                key = s["type"].lower()
                if key not in stats:
                    stats[key] = {"home": None, "away": None}
                stats[key][side] = s["value"]

        lineups = {}
        for lineup in lineups_data:
            side      = "home" if lineup["team"]["id"] == home_id else "away"
            formation = lineup.get("formation", "")
            start_xi  = []
            bench     = []

            for p in lineup.get("startXI", []):
                pl = p.get("player", {})
                start_xi.append({
                    "id":     pl.get("id"),
                    "name":   pl.get("name", ""),
                    "number": pl.get("number"),
                    "pos":    pl.get("pos", ""),
                    "grid":   pl.get("grid", ""),
                    "photo":  f"https://media.api-sports.io/football/players/{pl.get('id')}.png",
                })

            for p in lineup.get("substitutes", []):
                pl = p.get("player", {})
                bench.append({
                    "id":     pl.get("id"),
                    "name":   pl.get("name", ""),
                    "number": pl.get("number"),
                    "pos":    pl.get("pos", ""),
                    "photo":  f"https://media.api-sports.io/football/players/{pl.get('id')}.png",
                })

            lineups[side] = {
                "formation":  formation,
                "coach":      (lineup.get("coach") or {}).get("name", ""),
                "coachPhoto": (lineup.get("coach") or {}).get("photo", ""),
                "startXI":    start_xi,
                "bench":      bench,
            }

        player_stats = {}
        for team_data in players_data:
            side   = "home" if team_data["team"]["id"] == home_id else "away"
            p_list = []
            for p in team_data.get("players", []):
                info     = p.get("player", {})
                st       = (p.get("statistics") or [{}])[0]
                games    = st.get("games",    {})
                shots    = st.get("shots",    {})
                goals_s  = st.get("goals",    {})
                passes   = st.get("passes",   {})
                tackles  = st.get("tackles",  {})
                duels    = st.get("duels",    {})
                dribbles = st.get("dribbles", {})
                fouls    = st.get("fouls",    {})

                p_list.append({
                    "id":                info.get("id"),
                    "name":              info.get("name", ""),
                    "photo":             info.get("photo", ""),
                    "number":            games.get("number"),
                    "pos":               games.get("position", ""),
                    "rating":            float(games.get("rating") or 0),
                    "minutes":           games.get("minutes"),
                    "captain":           bool(games.get("captain", False)),
                    "shots":             shots.get("total"),
                    "shotsOn":           shots.get("on"),
                    "goals":             goals_s.get("total") or 0,
                    "assists":           goals_s.get("assists") or 0,
                    "conceded":          goals_s.get("conceded"),
                    "saves":             goals_s.get("saves"),
                    "passes":            passes.get("total"),
                    "passAcc":           passes.get("accuracy"),
                    "keyPasses":         passes.get("key") or 0,
                    "tackles":           tackles.get("total") or 0,
                    "blocks":            tackles.get("blocks") or 0,
                    "interceptions":     tackles.get("interceptions") or 0,
                    "duelsWon":          duels.get("won"),
                    "duelsTotal":        duels.get("total"),
                    "dribblesAttempted": dribbles.get("attempts"),
                    "dribblesSuccess":   dribbles.get("success") or 0,
                    "foulsDrawn":        fouls.get("drawn") or 0,
                    "foulsCommitted":    fouls.get("committed") or 0,
                })
            player_stats[side] = p_list

        return {
            "matchId":     fixture_id,
            "status":      fix["fixture"]["status"]["short"],
            "homeTeam":    fix["teams"]["home"]["name"],
            "awayTeam":    fix["teams"]["away"]["name"],
            "homeLogo":    fix["teams"]["home"]["logo"],
            "awayLogo":    fix["teams"]["away"]["logo"],
            "homeScore":   fix["goals"]["home"],
            "awayScore":   fix["goals"]["away"],
            "htHome":      fix["score"]["halftime"]["home"],
            "htAway":      fix["score"]["halftime"]["away"],
            "goals":       goals,
            "bookings":    bookings,
            "subs":        subs,
            "stats":       stats,
            "lineups":     lineups,
            "playerStats": player_stats,
            "referees":    [r.get("name","") for r in fix["fixture"].get("referees",[]) if isinstance(r,dict)],
            "venue":       (fix["fixture"].get("venue") or {}).get("name",""),
            "attendance":  fix["fixture"].get("attendance"),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Match events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/coaches/{league}")
def get_coaches(league: str):
    try:
        league_id = API_FOOTBALL_LEAGUE_IDS.get(league)
        if not league_id:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")

        resp = requests.get(
            f"{API_BASE}/coachs",
            headers=API_HEADERS,
            params={"league": league_id, "season": SEASON},
            timeout=10,
        )
        data = resp.json().get("response", [])

        coaches = []
        for entry in data:
            coach  = entry.get("coach", {})
            team   = entry.get("team", {})
            career = entry.get("career", [])
            total_games = sum(c.get("games", {}).get("appearences", 0) or 0 for c in career)
            total_wins  = sum(c.get("games", {}).get("wins", 0) or 0 for c in career)
            win_rate    = round((total_wins / total_games * 100), 1) if total_games > 0 else 0.0

            coaches.append({
                "id":           coach.get("id"),
                "name":         coach.get("name", ""),
                "firstname":    coach.get("firstname", ""),
                "lastname":     coach.get("lastname", ""),
                "photo":        coach.get("photo", ""),
                "nationality":  coach.get("nationality", ""),
                "birthDate":    coach.get("birth", {}).get("date", ""),
                "age":          coach.get("age"),
                "teamId":       team.get("id"),
                "teamName":     team.get("name", ""),
                "teamLogo":     team.get("logo", ""),
                "careerGames":  total_games,
                "careerWins":   total_wins,
                "winRate":      win_rate,
                "clubsManaged": len(career),
            })

        coaches.sort(key=lambda c: c["teamName"])
        return coaches

    except HTTPException:
        raise
    except Exception as e:
        print(f"Coaches fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/coaches/all/photo-map")
def get_all_coach_photos():
    try:
        photo_map = {}
        manager_names = [
            "Guardiola","Arteta","Slot","Carrick","Howe","Emery","Glasner",
            "Espírito Santo","Silva","Iraola","Hürzeler","Rosenior","Moyes",
            "Farke","Parker","Le Bris","Andrews","Edwards","Mason",
            "Flick","Arbeloa","Simeone","Valverde","Marcelino","Matarazzo",
            "Pellegrini","Almeyda","Míchel","Arrasate","Bordalás","Corberán",
            "Kompany","Hjulmand","Sahin","Werner","Hoeneß","Schuster",
            "Inzaghi","Conte","Motta","Gasperini","Allegri","Sarri",
            "Ranieri","Pioli","Baroni","De Zerbi","Genesio","Haise",
        ]
        for name in manager_names:
            try:
                resp = requests.get(
                    f"{API_BASE}/coachs",
                    headers=API_HEADERS,
                    params={"search": name},
                    timeout=5,
                )
                data = resp.json().get("response", [])
                if data:
                    coach = data[0].get("coach", {})
                    full  = (coach.get("name") or "").lower().strip()
                    photo = coach.get("photo", "")
                    if full and photo and "null" not in photo:
                        photo_map[full] = photo
            except Exception:
                continue

        return {"photos": photo_map, "teamLogos": {}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/coach-photo")
def get_coach_photo(name: str):
    try:
        import urllib.parse

        search_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list":   "search",
                "srsearch": f"{name} football manager",
                "srlimit": 3,
                "format": "json"
            },
            timeout=5,
            headers={"User-Agent": "FootballAnalystAI/1.0"}
        )

        if search_resp.status_code != 200:
            return {"photo": None}

        results = search_resp.json().get("query", {}).get("search", [])

        for result in results:
            title = result.get("title", "")
            skip_keywords = ["city", "town", "village", "stadium", "club", "fc ", "history", "season"]
            if any(k in title.lower() for k in skip_keywords):
                continue

            summary_resp = requests.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}",
                timeout=5,
                headers={"User-Agent": "FootballAnalystAI/1.0"}
            )

            if summary_resp.status_code != 200:
                continue

            data        = summary_resp.json()
            page_type   = data.get("type", "")
            description = data.get("description", "").lower()
            extract     = data.get("extract", "").lower()

            person_keywords = ["manager", "coach", "footballer", "born", "football"]
            is_person = (
                page_type == "standard" and
                any(k in description or k in extract[:200] for k in person_keywords)
            )

            if not is_person:
                continue

            img = data.get("originalimage", {}).get("source", "") or \
                  data.get("thumbnail", {}).get("source", "")

            if img:
                w = data.get("thumbnail", {}).get("width", 100)
                h = data.get("thumbnail", {}).get("height", 100)
                if w > 0 and h > 0 and w > h * 1.5:
                    continue
                return {"photo": img}

        return {"photo": None}

    except Exception as e:
        print(f"Coach photo error: {e}")
        return {"photo": None}


@app.get("/managers/live")
def get_live_managers():
    global _managers_cache, _managers_cache_ts

    now = time.time()
    if _managers_cache and now - _managers_cache_ts < MANAGERS_TTL:
        return _managers_cache

    try:
        if not FOOTBALL_DATA_KEY:
            raise HTTPException(status_code=400, detail="FOOTBALL_DATA_API_KEY not set")

        all_managers = []
        for league_name, comp_id in FDORG_COMPETITION_IDS.items():
            try:
                resp = requests.get(
                    f"{FDORG_BASE}/competitions/{comp_id}/teams",
                    headers=FDORG_HEADERS,
                    params={"season": 2025},
                    timeout=10,
                )
                if resp.status_code != 200:
                    print(f"football-data.org error for {league_name}: {resp.status_code}")
                    continue

                teams = resp.json().get("teams", [])
                for team in teams:
                    coach = team.get("coach", {})
                    if not coach or not coach.get("name"):
                        continue

                    contract = coach.get("contract", {}) or {}
                    all_managers.append({
                        "name":          coach.get("name", ""),
                        "firstName":     coach.get("firstName", ""),
                        "lastName":      coach.get("lastName", ""),
                        "nationality":   coach.get("nationality", ""),
                        "dateOfBirth":   coach.get("dateOfBirth", ""),
                        "team":          team.get("name", ""),
                        "teamId":        team.get("id"),
                        "teamLogo":      team.get("crest", ""),
                        "teamShortName": team.get("shortName", ""),
                        "league":        league_name,
                        "contractStart": contract.get("start", ""),
                        "contractUntil": contract.get("until", ""),
                    })

            except Exception as le:
                print(f"Manager fetch error for {league_name}: {le}")
                continue

        _managers_cache    = all_managers
        _managers_cache_ts = now
        return all_managers

    except HTTPException:
        raise
    except Exception as e:
        print(f"Live managers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_with_gemini(request: dict):
    import httpx

    GEMINI_KEY    = os.getenv("GOOGLE_GEMINI_API_KEY", "")
    GEMINI_MODELS = [
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
    ]

    messages     = request.get("messages", [])
    user_message = "\n".join(m.get("content", "") for m in messages)

    request_body = {
        "contents":         [{"parts": [{"text": user_message}]}],
        "generationConfig": {"maxOutputTokens": 2000, "temperature": 0.7},
    }

    text       = ""
    last_error = ""

    async with httpx.AsyncClient(timeout=30) as client:
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
            try:
                resp = await client.post(url, json=request_body)
                data = resp.json()
                if data.get("candidates") and data["candidates"][0]:
                    parts = data["candidates"][0].get("content", {}).get("parts", [])
                    text  = "\n".join(p.get("text", "") for p in parts)
                    break
                last_error = data.get("error", {}).get("message", "Unknown error")
            except Exception as e:
                last_error = str(e)

    if not text:
        text = f"All models busy. Please try again. ({last_error})"

    return {"content": [{"type": "text", "text": text}]}

@app.get("/best-picks")
def get_best_picks_endpoint(refresh: bool = False):
    try:
        from services.best_picks_service import get_best_picks
        return get_best_picks(models, force_refresh=refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/injuries/{league}")
def get_injuries(league: str):
    try:
        league_id = API_FOOTBALL_LEAGUE_IDS.get(league)
        if not league_id:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")

        resp = requests.get(
            f"{API_BASE}/injuries",
            headers=API_HEADERS,
            params={"league": league_id, "season": SEASON},
            timeout=10,
        )
        data = resp.json().get("response", [])

        # Deduplicate by player ID — keep the entry with the latest return date
        seen = {}
        for entry in data:
            player = entry.get("player", {})
            team   = entry.get("team", {})
            fix    = entry.get("fixture", {})
            pid    = player.get("id") or player.get("name", "")
            date   = fix.get("date", "") or ""

            if pid not in seen or date > seen[pid]["returnDate"]:
                seen[pid] = {
                    "player":      player.get("name", ""),
                    "playerPhoto": player.get("photo", ""),
                    "team":        team.get("name", ""),
                    "teamLogo":    team.get("logo", ""),
                    "type":        player.get("reason", "") or player.get("type", ""),
                    "reason":      player.get("type", ""),
                    "returnDate":  date[:10] if date else "Unknown",
                }

        # Filter out players whose last recorded return date is in the past
        from datetime import date as dt
        today = str(dt.today())
        current = [v for v in seen.values() if v["returnDate"] >= today or v["returnDate"] == "Unknown"]

        return sorted(current, key=lambda x: x["team"])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

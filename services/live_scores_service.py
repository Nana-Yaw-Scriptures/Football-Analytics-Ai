"""
Live Scores Service — fetches today's fixtures from API-Football.
Save as: football-analyst-backend/services/live_scores_service.py
"""

import requests
import json
import os
import time
from datetime import date, datetime, timezone
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL = "https://v3.football.api-sports.io"
CACHE_DIR = "cache"
HEADERS = {"x-apisports-key": API_KEY}

os.makedirs(CACHE_DIR, exist_ok=True)

# Top 5 league IDs in API-Football
LEAGUE_IDS = {
    "Premier League": 39,
    "La Liga": 140,
    "Bundesliga": 78,
    "Serie A": 135,
    "Ligue 1": 61,
        "Primeira Liga": 94,
        "Champions League": 2,  
}

# ── Add INTERNATIONAL_IDS ──────────────────────────
INTERNATIONAL_IDS = {
    "International Friendly":          10,
    "UEFA Nations League":             5,
    "World Cup Qualifiers - UEFA":     9,
    "World Cup Qualifiers - CAF":      29,
    "World Cup Qualifiers - CONMEBOL": 35,
    "World Cup Qualifiers - CONCACAF": 30,
    "World Cup Qualifiers - AFC":      36,
    "AFCON":                           6,
    "Copa America":                    26,
}


# ── Add this function at the bottom of live_scores_service.py ────────
def get_international_fixtures(date=None, upcoming=False):
    """Fetch international fixtures for a given date or upcoming."""
    from datetime import datetime, timezone

    if upcoming:
        cache_name = "intl_upcoming"
        cached = _read_cache(cache_name, max_age_seconds=1800)  # 30 min
        if cached is not None:
            return cached
    else:
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cache_name = f"intl_{date}"
        cached = _read_cache(cache_name, max_age_seconds=120)
        if cached is not None:
            return cached

    all_fixtures = []

    all_fixtures = []

    # Determine season dynamically — try primary then fallback if no results.
    # API-Football seasons: Friendlies use calendar year (2026), tournaments use start year (2025 for 2025-26).
    current_year = datetime.now(timezone.utc).year
    CURRENT_YEAR_LEAGUES = {10}  # International Friendlies match calendar year

    for league_name, league_id in INTERNATIONAL_IDS.items():
        try:
            primary_season  = current_year if league_id in CURRENT_YEAR_LEAGUES else current_year - 1
            fallback_season = current_year if primary_season == current_year - 1 else current_year - 1

            if upcoming:
                params = {
                    "league": league_id,
                    "season": primary_season,
                    "next": 10,
                }
            else:
                params = {
                    "league": league_id,
                    "season": primary_season,
                    "date": date,
                }

            data = _get("fixtures", params)

            # No results with primary season — try fallback
            if not data.get("response"):
                fallback_params = dict(params)
                fallback_params["season"] = fallback_season
                data = _get("fixtures", fallback_params)
            for fix in data.get("response", []):
                fixture    = fix.get("fixture", {})
                teams      = fix.get("teams", {})
                goals      = fix.get("goals", {})
                score      = fix.get("score", {})
                league_info= fix.get("league", {})
                status     = fixture.get("status", {})
                status_short = status.get("short", "NS")
                elapsed    = status.get("elapsed")

                all_fixtures.append({
                    "id":         fixture.get("id"),
                    "date":       fixture.get("date"),
                    "timestamp":  fixture.get("timestamp"),
                    "referee":    fixture.get("referee"),
                    "venue":      fixture.get("venue", {}).get("name"),
                    "league":     league_name,
                    "leagueLogo": league_info.get("logo"),
                    "round":      league_info.get("round", ""),
                    "status":     status_short,
                    "elapsed":    elapsed,
                    "statusLong": status.get("long", ""),
                    "homeTeam":   teams.get("home", {}).get("name", ""),
                    "homeLogo":   teams.get("home", {}).get("logo", ""),
                    "homeId":     teams.get("home", {}).get("id"),
                    "awayTeam":   teams.get("away", {}).get("name", ""),
                    "awayLogo":   teams.get("away", {}).get("logo", ""),
                    "awayId":     teams.get("away", {}).get("id"),
                    "homeGoals":  goals.get("home"),
                    "awayGoals":  goals.get("away"),
                    "htHome":     score.get("halftime", {}).get("home"),
                    "htAway":     score.get("halftime", {}).get("away"),
                    "isInternational": True,
                })
        except Exception as e:
            print(f"[LiveScores] International fetch error for {league_name}: {e}")
            continue

    # Sort: live first, then upcoming, then finished
    status_order = {
        "1H": 0, "2H": 0, "HT": 0, "ET": 0, "P": 0,
        "NS": 1, "TBD": 1,
        "FT": 2, "AET": 2, "PEN": 2,
        "PST": 3, "CANC": 3,
    }
    all_fixtures.sort(key=lambda f: (
        status_order.get(f["status"], 2),
        f.get("timestamp", 0)
    ))

    _write_cache(cache_name, all_fixtures)
    return all_fixtures
SEASON = 2025  # API-Football uses the start year of the season (2024 = 2024-25 season)


def _get(endpoint, params=None):
    """Make API-Football request with retry on rate limit."""
    url = f"{BASE_URL}/{endpoint}"
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
            data = resp.json()
            if data.get("errors"):
                err = str(data["errors"])
                if "rateLimit" in err:
                    print(f"[LiveScores] Rate limited, waiting 60s...")
                    time.sleep(60)
                    continue
                print(f"[LiveScores] API error: {err}")
            return data
        except Exception as e:
            print(f"[LiveScores] Request failed: {e}")
            if attempt < 2:
                time.sleep(2)
    return {"response": []}


def _cache_key(name):
    return os.path.join(CACHE_DIR, f"live_{name}.json")


def _read_cache(name, max_age_seconds=120):
    """Read from cache if fresh enough."""
    path = _cache_key(name)
    if os.path.exists(path):
        age = time.time() - os.path.getmtime(path)
        if age < max_age_seconds:
            with open(path, "r") as f:
                return json.load(f)
    return None


def _write_cache(name, data):
    path = _cache_key(name)
    with open(path, "w") as f:
        json.dump(data, f)


def get_todays_fixtures(league=None):
    """
    Fetch today's fixtures for top 5 leagues (or a specific league).
    Caches for 2 minutes.
    Returns list of formatted fixture objects.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_name = f"fixtures_{today}_{league or 'all'}"

    cached = _read_cache(cache_name, max_age_seconds=600)
    if cached is not None:
        return cached

    all_fixtures = []

    leagues_to_fetch = ({league: LEAGUE_IDS[league]} if league and league in LEAGUE_IDS else LEAGUE_IDS)

    for league_name, league_id in leagues_to_fetch.items():
        data = _get("fixtures", {
            "league": league_id,
            "season": SEASON,
            "date": today,
        })

        for fix in data.get("response", []):
            fixture = fix.get("fixture", {})
            teams = fix.get("teams", {})
            goals = fix.get("goals", {})
            score = fix.get("score", {})
            league_info = fix.get("league", {})

            status = fixture.get("status", {})
            status_short = status.get("short", "NS")
            elapsed = status.get("elapsed")

            all_fixtures.append({
                "id": fixture.get("id"),
                "date": fixture.get("date"),
                "timestamp": fixture.get("timestamp"),
                "referee": fixture.get("referee"),
                "venue": fixture.get("venue", {}).get("name"),
                "league": league_name,
                "leagueLogo": league_info.get("logo"),
                "round": league_info.get("round", ""),
                "status": status_short,
                "elapsed": elapsed,
                "statusLong": status.get("long", ""),
                "homeTeam": teams.get("home", {}).get("name", ""),
                "homeLogo": teams.get("home", {}).get("logo", ""),
                "homeId": teams.get("home", {}).get("id"),
                "awayTeam": teams.get("away", {}).get("name", ""),
                "awayLogo": teams.get("away", {}).get("logo", ""),
                "awayId": teams.get("away", {}).get("id"),
                "homeGoals": goals.get("home"),
                "awayGoals": goals.get("away"),
                "htHome": score.get("halftime", {}).get("home"),
                "htAway": score.get("halftime", {}).get("away"),
            })

    # Sort: live first, then upcoming, then finished
    status_order = {"1H": 0, "2H": 0, "HT": 0, "ET": 0, "P": 0, "LIVE": 0, "NS": 1, "TBD": 1, "FT": 2, "AET": 2, "PEN": 2, "PST": 3, "CANC": 3, "ABD": 3, "AWD": 3, "WO": 3}
    all_fixtures.sort(key=lambda f: (status_order.get(f["status"], 2), f.get("timestamp", 0)))

    _write_cache(cache_name, all_fixtures)
    return all_fixtures


def get_live_fixtures():
    """Fetch only currently live fixtures across all top 5 leagues."""
    cache_name = "live_now"
    cached = _read_cache(cache_name, max_age_seconds=180)  # 3 min
    if cached is not None:
        return cached

    all_live = []
    for league_name, league_id in LEAGUE_IDS.items():
        data = _get("fixtures", {
            "league": league_id,
            "season": SEASON,
            "live": "all",
        })
        for fix in data.get("response", []):
            fixture = fix.get("fixture", {})
            teams = fix.get("teams", {})
            goals = fix.get("goals", {})
            events = fix.get("events", [])
            status = fixture.get("status", {})

            formatted_events = []
            for evt in events[:20]:  # Last 20 events
                formatted_events.append({
                    "time": evt.get("time", {}).get("elapsed"),
                    "extra": evt.get("time", {}).get("extra"),
                    "team": evt.get("team", {}).get("name"),
                    "teamLogo": evt.get("team", {}).get("logo"),
                    "player": evt.get("player", {}).get("name"),
                    "assist": evt.get("assist", {}).get("name"),
                    "type": evt.get("type"),
                    "detail": evt.get("detail"),
                })

            all_live.append({
                "id": fixture.get("id"),
                "date": fixture.get("date"),
                "league": league_name,
                "status": status.get("short"),
                "elapsed": status.get("elapsed"),
                "homeTeam": teams.get("home", {}).get("name"),
                "homeLogo": teams.get("home", {}).get("logo"),
                "awayTeam": teams.get("away", {}).get("name"),
                "awayLogo": teams.get("away", {}).get("logo"),
                "homeGoals": goals.get("home"),
                "awayGoals": goals.get("away"),
                "events": formatted_events,
            })

    _write_cache(cache_name, all_live)
    return all_live


def get_fixture_detail(fixture_id):
    """Fetch full detail for a single fixture — lineups, stats, events."""
    cache_name = f"fixture_{fixture_id}"
    cached = _read_cache(cache_name, max_age_seconds=300)  # 5 min
    if cached is not None:
        return cached

    # Fixture basic info
    data = _get("fixtures", {"id": fixture_id})
    if not data.get("response"):
        return None

    fix = data["response"][0]
    fixture = fix.get("fixture", {})
    teams = fix.get("teams", {})
    goals = fix.get("goals", {})
    score = fix.get("score", {})
    events = fix.get("events", [])
    lineups = fix.get("lineups", [])
    statistics = fix.get("statistics", [])
    players = fix.get("players", [])

    # Format events
    formatted_events = []
    for evt in events:
        formatted_events.append({
            "time": evt.get("time", {}).get("elapsed"),
            "extra": evt.get("time", {}).get("extra"),
            "team": evt.get("team", {}).get("name"),
            "teamLogo": evt.get("team", {}).get("logo"),
            "player": evt.get("player", {}).get("name"),
            "assist": evt.get("assist", {}).get("name"),
            "type": evt.get("type"),
            "detail": evt.get("detail"),
        })

    # Format lineups
    formatted_lineups = []
    for lineup in lineups:
        team_lineup = {
            "team": lineup.get("team", {}).get("name"),
            "teamLogo": lineup.get("team", {}).get("logo"),
            "formation": lineup.get("formation"),
            "startXI": [],
            "substitutes": [],
            "coach": lineup.get("coach", {}).get("name"),
        }
        for player in lineup.get("startXI", []):
            p = player.get("player", {})
            team_lineup["startXI"].append({
                "id": p.get("id"),
                "name": p.get("name"),
                "number": p.get("number"),
                "pos": p.get("pos"),
            })
        for player in lineup.get("substitutes", []):
            p = player.get("player", {})
            team_lineup["substitutes"].append({
                "id": p.get("id"),
                "name": p.get("name"),
                "number": p.get("number"),
                "pos": p.get("pos"),
            })
        formatted_lineups.append(team_lineup)

    # Format statistics
    formatted_stats = {}
    for team_stats in statistics:
        team_name = team_stats.get("team", {}).get("name", "")
        stats_dict = {}
        for stat in team_stats.get("statistics", []):
            stats_dict[stat.get("type", "")] = stat.get("value")
        formatted_stats[team_name] = stats_dict

    result = {
        "id": fixture.get("id"),
        "date": fixture.get("date"),
        "referee": fixture.get("referee"),
        "venue": fixture.get("venue", {}).get("name"),
        "city": fixture.get("venue", {}).get("city"),
        "status": fixture.get("status", {}).get("short"),
        "elapsed": fixture.get("status", {}).get("elapsed"),
        "statusLong": fixture.get("status", {}).get("long"),
        "homeTeam": teams.get("home", {}).get("name"),
        "homeLogo": teams.get("home", {}).get("logo"),
        "awayTeam": teams.get("away", {}).get("name"),
        "awayLogo": teams.get("away", {}).get("logo"),
        "homeGoals": goals.get("home"),
        "awayGoals": goals.get("away"),
        "htHome": score.get("halftime", {}).get("home"),
        "htAway": score.get("halftime", {}).get("away"),
        "ftHome": score.get("fulltime", {}).get("home"),
        "ftAway": score.get("fulltime", {}).get("away"),
        "events": formatted_events,
        "lineups": formatted_lineups,
        "statistics": formatted_stats,
    }

    _write_cache(cache_name, result)
    return result


def get_upcoming_fixtures(league=None, days=7):
    """Fetch upcoming fixtures for the next N days."""
    cache_name = f"upcoming_v4_{league or 'all'}_{days}"
    cached = _read_cache(cache_name, max_age_seconds=600)  # 10 min cache
    if cached is not None:
        return cached

    all_fixtures = []

    leagues_to_fetch = {league: LEAGUE_IDS[league]} if league and league in LEAGUE_IDS else LEAGUE_IDS

    for league_name, league_id in leagues_to_fetch.items():
        # next=20 ensures full gameweek is returned for any league
        data = _get("fixtures", {
            "league": league_id,
            "season": SEASON,
            "next": 20,
        })

        for fix in data.get("response", []):
            fixture = fix.get("fixture", {})
            teams = fix.get("teams", {})
            league_info = fix.get("league", {})

            fix_date = fixture.get("date", "")
            all_fixtures.append({
                "id": fixture.get("id"),
                "date": fix_date,
                "timestamp": fixture.get("timestamp"),
                "league": league_name,
                "leagueLogo": league_info.get("logo"),
                "round": league_info.get("round", ""),
                "homeTeam": teams.get("home", {}).get("name"),
                "homeLogo": teams.get("home", {}).get("logo"),
                "awayTeam": teams.get("away", {}).get("name"),
                "awayLogo": teams.get("away", {}).get("logo"),
                "venue": fixture.get("venue", {}).get("name"),
            })

    all_fixtures.sort(key=lambda f: f.get("timestamp", 0))
    _write_cache(cache_name, all_fixtures)
    return all_fixtures
"""
Fetches complete player stats from API-Football (api-sports.io).
Scrapes by LEAGUE (not team) so each player appears once with current team.
Stats are combined across all teams if a player transferred mid-season.
Paid tier recommended (Pro: $19/mo = 7,500 req/day).
Save as: services/api_football_scraper.py

Fields added vs original:
  ✅ goals.xg          → xG  (expected goals — was completely missing)
  ✅ passes.xA         → xA  (expected assists — was completely missing)
  ✅ cards.yellowred   → yellowRedCards (double yellow → red, was missing)
  ✅ penalty.commited  → penaltiesCommitted (was missing — note API typo: "commited")
  ✅ substitutes.in    → subIn   (how many times came on as sub)
  ✅ substitutes.out   → subOut  (how many times subbed off)
  ✅ substitutes.bench → subBench (times on bench but not used)
  ✅ games.captain     → captain (bool — was missing)
  ✅ games.number      → jerseyNumber (shirt number — was missing)
  ✅ offsides          → offsides (was missing entirely)
"""

import requests
import json
import os
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL = "https://v3.football.api-sports.io"
CACHE_DIR = "cache"
from services.season import SEASON # 2025-2026 season (API uses start year)

HEADERS = {"x-apisports-key": API_KEY}

LEAGUES = {
    "Premier League": 39,
    "La Liga": 140,
    "Bundesliga": 78,
    "Serie A": 135,
    "Ligue 1": 61,
    "Champions League": 2,    # ← New
    "Primeira Liga": 94,      # ← New (Liga Nos)
}

os.makedirs(CACHE_DIR, exist_ok=True)


# ============================================================
# API Helpers
# ============================================================

def _get(endpoint, params=None):
    """Make API request with rate limiting and retry"""
    url = f"{BASE_URL}/{endpoint}"

    for attempt in range(3):
        resp = requests.get(url, headers=HEADERS, params=params)
        data = resp.json()

        if data.get("errors"):
            if "rateLimit" in str(data["errors"]):
                print(f"  Rate limited, waiting 60s...")
                time.sleep(60)
                continue
            print(f"  API Error: {data['errors']}")

        return data

    return {"response": []}


def _cache_path(league_name):
    safe = league_name.replace(" ", "_").lower()
    return os.path.join(CACHE_DIR, f"players_{safe}_{SEASON}.json")


def _is_cache_fresh(league_name, max_hours=24):
    path = _cache_path(league_name)
    if not os.path.exists(path):
        return False
    mod_time = os.path.getmtime(path)
    hours_old = (time.time() - mod_time) / 3600
    return hours_old < max_hours


def check_requests_remaining():
    """Check how many API requests are left today"""
    data = _get("status")
    if data.get("response"):
        current = data["response"]["requests"]["current"]
        limit = data["response"]["requests"]["limit_day"]
        remaining = limit - current
        print(f"API requests: {current}/{limit} used, {remaining} remaining")
        return remaining
    return 0


# ============================================================
# Player Parsing — combines stats across all teams
# ============================================================

def _safe(val, default=0):
    """Safely convert None to default"""
    return val if val is not None else default


def _safe_float(val, default=0.0):
    """Safely convert None/string to float"""
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _parse_player(entry, league_name):
    """
    Parse a player entry. If the player has stats for multiple teams
    (mid-season transfer), combine them and use the LAST team as current.
    """
    player_info = entry.get("player", {})
    stats_list  = entry.get("statistics", [])

    if not stats_list:
        return None

    # Current team = last entry in the stats list (most recent team)
    current_stats    = stats_list[-1]
    current_team     = current_stats.get("team", {}).get("name", "Unknown")
    current_team_logo= current_stats.get("team", {}).get("logo", "")
    position         = current_stats.get("games", {}).get("position", "Unknown")
    jersey_number    = current_stats.get("games", {}).get("number")
    is_captain       = bool(current_stats.get("games", {}).get("captain", False))

    # ── Accumulators ────────────────────────────────────────
    total_appearances      = 0
    total_lineups          = 0
    total_minutes          = 0
    total_goals            = 0
    total_assists          = 0
    total_conceded         = 0
    total_saves            = 0
    total_shots            = 0
    total_shots_on         = 0
    total_passes           = 0
    total_key_passes       = 0
    total_tackles          = 0
    total_blocks           = 0
    total_interceptions    = 0
    total_duels            = 0
    total_duels_won        = 0
    total_dribbles_att     = 0
    total_dribbles_success = 0
    total_dribbled_past    = 0
    total_fouls_drawn      = 0
    total_fouls_committed  = 0
    total_yellow           = 0
    total_yellow_red       = 0   # ✅ NEW: double yellow → red
    total_red              = 0
    total_pen_won          = 0
    total_pen_committed    = 0   # ✅ NEW: penalties given away
    total_pen_scored       = 0
    total_pen_missed       = 0
    total_pen_saved        = 0
    total_offsides         = 0   # ✅ NEW: offsides
    total_sub_in           = 0   # ✅ NEW: times subbed on
    total_sub_out          = 0   # ✅ NEW: times subbed off
    total_sub_bench        = 0   # ✅ NEW: times on bench unused
    total_xg               = 0.0 # ✅ NEW: expected goals
    total_xA               = 0.0 # ✅ NEW: expected assists
    rating_sum             = 0.0
    rating_count           = 0
    pass_acc_sum           = 0.0
    pass_acc_count         = 0

    for stats in stats_list:
        games       = stats.get("games", {})
        shots       = stats.get("shots", {})
        goals       = stats.get("goals", {})
        passes      = stats.get("passes", {})
        tackles     = stats.get("tackles", {})
        duels       = stats.get("duels", {})
        dribbles    = stats.get("dribbles", {})
        fouls       = stats.get("fouls", {})
        cards       = stats.get("cards", {})
        penalty     = stats.get("penalty", {})
        substitutes = stats.get("substitutes", {})  # ✅ NEW section
        offsides    = stats.get("offsides")          # ✅ NEW — top-level field

        app  = _safe(games.get("appearences"))
        mins = _safe(games.get("minutes"))

        total_appearances      += app
        total_lineups          += _safe(games.get("lineups"))
        total_minutes          += mins
        total_goals            += _safe(goals.get("total"))
        total_assists          += _safe(goals.get("assists"))
        total_conceded         += _safe(goals.get("conceded"))
        total_saves            += _safe(goals.get("saves"))
        total_shots            += _safe(shots.get("total"))
        total_shots_on         += _safe(shots.get("on"))
        total_passes           += _safe(passes.get("total"))
        total_key_passes       += _safe(passes.get("key"))
        total_tackles          += _safe(tackles.get("total"))
        total_blocks           += _safe(tackles.get("blocks"))
        total_interceptions    += _safe(tackles.get("interceptions"))
        total_duels            += _safe(duels.get("total"))
        total_duels_won        += _safe(duels.get("won"))
        total_dribbles_att     += _safe(dribbles.get("attempts"))
        total_dribbles_success += _safe(dribbles.get("success"))
        total_dribbled_past    += _safe(dribbles.get("past"))
        total_fouls_drawn      += _safe(fouls.get("drawn"))
        total_fouls_committed  += _safe(fouls.get("committed"))
        total_yellow           += _safe(cards.get("yellow"))
        total_yellow_red       += _safe(cards.get("yellowred"))    # ✅ NEW
        total_red              += _safe(cards.get("red"))
        total_pen_won          += _safe(penalty.get("won"))
        total_pen_committed    += _safe(penalty.get("commited"))   # ✅ NEW (API typo: one 't')
        total_pen_scored       += _safe(penalty.get("scored"))
        total_pen_missed       += _safe(penalty.get("missed"))
        total_pen_saved        += _safe(penalty.get("saved"))
        total_offsides         += _safe(offsides)                  # ✅ NEW
        total_sub_in           += _safe(substitutes.get("in"))     # ✅ NEW
        total_sub_out          += _safe(substitutes.get("out"))    # ✅ NEW
        total_sub_bench        += _safe(substitutes.get("bench"))  # ✅ NEW

        # ✅ NEW: xG — API-Football stores it under goals.xg
        xg_val = goals.get("xg")
        total_xg += _safe_float(xg_val)

        # ✅ NEW: xA — API-Football stores it under passes.xA (some versions)
        xA_val = passes.get("xA") or passes.get("xa")
        total_xA += _safe_float(xA_val)

        r = games.get("rating")
        if r:
            rating_sum   += float(r) * app
            rating_count += app

        pa = passes.get("accuracy")
        if pa:
            pass_acc_sum   += float(pa) * app
            pass_acc_count += app

    # Skip players with no appearances
    if total_appearances < 1:
        return None

    avg_rating   = round(rating_sum   / max(rating_count,   1), 6)
    avg_pass_acc = round(pass_acc_sum / max(pass_acc_count, 1), 1)

    return {
        # ── Identity ─────────────────────────────────────────────
        "id":            player_info.get("id"),
        "name":          player_info.get("name", ""),
        "firstName":     player_info.get("firstname", ""),
        "lastName":      player_info.get("lastname", ""),
        "age":           player_info.get("age", 0),
        "nationality":   player_info.get("nationality", ""),
        "height":        player_info.get("height", ""),
        "weight":        player_info.get("weight", ""),
        "photo":         player_info.get("photo", ""),

        # ── Club & League ─────────────────────────────────────────
        "team":          current_team,
        "teamLogo":      current_team_logo,
        "league":        league_name,
        "position":      position,
        "jerseyNumber":  jersey_number,   # ✅ NEW
        "captain":       is_captain,      # ✅ NEW

        # ── Appearances ───────────────────────────────────────────
        "rating":        avg_rating,
        "appearances":   total_appearances,
        "lineups":       total_lineups,
        "minutes":       total_minutes,
        "minsPerGame":   round(total_minutes / max(total_appearances, 1), 1),
        "subIn":         total_sub_in,    # ✅ NEW
        "subOut":        total_sub_out,   # ✅ NEW
        "subBench":      total_sub_bench, # ✅ NEW

        # ── Attacking ─────────────────────────────────────────────
        "goals":         total_goals,
        "assists":       total_assists,
        "xG":            round(total_xg, 2),  # ✅ NEW — was completely missing
        "xA":            round(total_xA, 2),  # ✅ NEW — was completely missing
        "shotsTotal":    total_shots,
        "shotsOnTarget": total_shots_on,
        "shotAccuracy":  round(total_shots_on / max(total_shots, 1) * 100, 1),
        "offsides":      total_offsides,      # ✅ NEW

        # ── Passing ───────────────────────────────────────────────
        "passesTotal":   total_passes,
        "keyPasses":     total_key_passes,
        "passAccuracy":  avg_pass_acc,

        # ── Defending ─────────────────────────────────────────────
        "tacklesTotal":    total_tackles,
        "blocks":          total_blocks,
        "interceptions":   total_interceptions,
        "goalsConceded":   total_conceded,
        "saves":           total_saves,

        # ── Duels & Dribbles ──────────────────────────────────────
        "duelsTotal":         total_duels,
        "duelsWon":           total_duels_won,
        "duelWinPct":         round(total_duels_won / max(total_duels, 1) * 100, 1),
        "dribblesAttempted":  total_dribbles_att,
        "dribblesSuccessful": total_dribbles_success,
        "dribbleSuccessPct":  round(total_dribbles_success / max(total_dribbles_att, 1) * 100, 1),
        "dribbledPast":       total_dribbled_past,

        # ── Discipline ────────────────────────────────────────────
        "foulsDrawn":       total_fouls_drawn,
        "foulsCommitted":   total_fouls_committed,
        "yellowCards":      total_yellow,
        "yellowRedCards":   total_yellow_red, # ✅ NEW
        "redCards":         total_red,

        # ── Penalties ─────────────────────────────────────────────
        "penaltiesWon":       total_pen_won,
        "penaltiesCommitted": total_pen_committed, # ✅ NEW
        "penaltiesScored":    total_pen_scored,
        "penaltiesMissed":    total_pen_missed,
        "penaltiesSaved":     total_pen_saved,

        # ── Per 90 ────────────────────────────────────────────────
        "goalsPerNinety":   round(total_goals    / max(total_minutes, 1) * 90, 2),
        "assistsPerNinety": round(total_assists  / max(total_minutes, 1) * 90, 2),
        "xGPerNinety":      round(total_xg       / max(total_minutes, 1) * 90, 2),  # ✅ NEW
        "xAPerNinety":      round(total_xA       / max(total_minutes, 1) * 90, 2),  # ✅ NEW
        "tacklesPerNinety": round(total_tackles  / max(total_minutes, 1) * 90, 2),
        "duelsPerNinety":   round(total_duels    / max(total_minutes, 1) * 90, 2),
        "keyPassesPerNinety": round(total_key_passes / max(total_minutes, 1) * 90, 2),  # ✅ NEW
    }


# ============================================================
# Scraping — by league (not by team)
# ============================================================

def scrape_league_players(league_name, league_id):
    """
    Scrape all players for a league using the league endpoint.
    Each player appears ONCE with their current team.
    ~25-35 pages per league = 25-35 API requests.
    """
    if _is_cache_fresh(league_name):
        print(f"  {league_name}: Using cached data")
        with open(_cache_path(league_name), "r") as f:
            return json.load(f)

    print(f"  {league_name}: Fetching players...")

    all_players = []
    page = 1

    while True:
        data = _get("players", {
            "league":  league_id,
            "season":  SEASON,
            "page":    page,
        })

        if not data.get("response"):
            break

        for entry in data["response"]:
            player = _parse_player(entry, league_name)
            if player:
                all_players.append(player)

        paging      = data.get("paging", {})
        total_pages = paging.get("total", 1)

        if page % 5 == 0 or page == total_pages:
            print(f"    Page {page}/{total_pages} — {len(all_players)} players so far")

        if page >= total_pages:
            break

        page += 1
        time.sleep(7)  # Rate limit: max 10 requests per minute

    # Deduplicate by player ID (safety net)
    seen = {}
    for player in all_players:
        pid = player["id"]
        if pid not in seen or player["minutes"] > seen[pid]["minutes"]:
            seen[pid] = player
    all_players = list(seen.values())

    # Cache results
    with open(_cache_path(league_name), "w") as f:
        json.dump(all_players, f)

    print(f"  {league_name}: {len(all_players)} players total ({page} pages, cached)")
    return all_players


def scrape_all_leagues():
    """Scrape all 5 leagues. ~150-175 total API requests."""
    remaining   = check_requests_remaining()
    all_players = []

    for league_name, league_id in LEAGUES.items():
        if _is_cache_fresh(league_name):
            with open(_cache_path(league_name), "r") as f:
                players = json.load(f)
            print(f"  {league_name}: {len(players)} players (cached)")
            all_players.extend(players)
            continue

        if remaining < 40:
            print(f"  {league_name}: Skipped (only {remaining} requests left)")
            continue

        players = scrape_league_players(league_name, league_id)
        all_players.extend(players)
        remaining = check_requests_remaining()

    # Cross-league deduplication (transfers between leagues)
    seen = {}
    for player in all_players:
        pid = player.get("id")
        if pid not in seen or player["minutes"] > seen[pid]["minutes"]:
            seen[pid] = player
    all_players = list(seen.values())

    all_players.sort(key=lambda x: x.get("goals", 0), reverse=True)
    print(f"\nTotal: {len(all_players)} unique players across {len(LEAGUES)} leagues")
    return all_players


def get_all_players():
    """Get all players from cache"""
    all_players = []

    for league_name, league_id in LEAGUES.items():
        cache = _cache_path(league_name)
        if os.path.exists(cache):
            with open(cache, "r") as f:
                players = json.load(f)
            all_players.extend(players)
        else:
            print(f"  No cache for {league_name}. Run scrape first.")

    # Deduplicate across leagues
    seen = {}
    for player in all_players:
        pid = player.get("id")
        if pid not in seen or player["minutes"] > seen[pid]["minutes"]:
            seen[pid] = player
    all_players = list(seen.values())

    all_players.sort(key=lambda x: x.get("goals", 0), reverse=True)
    return all_players


# ============================================================
# Enrichment — merge into Understat players
# ============================================================

def enrich_understat_players(understat_players, api_football_players):
    """Merge API-Football stats into Understat players"""
    lookup = {}
    for p in api_football_players:
        name = p.get("name", "").lower()
        team = p.get("team", "").lower()
        lookup[f"{name}_{team}"] = p
        last = name.split()[-1] if name.split() else ""
        if len(last) > 3:
            lookup[f"{last}_{team}"] = p

    enriched = 0
    for player in understat_players:
        name = player.get("name", "").lower()
        team = player.get("team", "").lower()

        af = lookup.get(f"{name}_{team}")
        if not af:
            last = name.split()[-1] if name.split() else ""
            if len(last) > 3:
                af = lookup.get(f"{last}_{team}")

        if af:
            for k in [
                # Original fields
                "tacklesTotal", "blocks", "interceptions", "duelsTotal", "duelsWon",
                "duelWinPct", "dribblesAttempted", "dribblesSuccessful", "dribbleSuccessPct",
                "dribbledPast", "passesTotal", "passAccuracy", "foulsDrawn", "foulsCommitted",
                "saves", "goalsConceded", "penaltiesSaved", "rating", "photo", "teamLogo",
                "tacklesPerNinety", "duelsPerNinety", "height", "weight", "nationality",
                # ✅ NEW fields to also enrich
                "xG", "xA", "xGPerNinety", "xAPerNinety",
                "yellowRedCards", "penaltiesCommitted",
                "offsides", "subIn", "subOut", "subBench",
                "jerseyNumber", "captain", "keyPassesPerNinety",
            ]:
                if k not in player and k in af:
                    player[k] = af[k]
            enriched += 1

    print(f"Enriched {enriched}/{len(understat_players)} players with API-Football data")
    return understat_players


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    print("=" * 50)
    print("API-FOOTBALL PLAYER SCRAPER")
    print("=" * 50)

    remaining = check_requests_remaining()

    if remaining < 10:
        print("\nNot enough requests remaining. Loading from cache...")
        players = get_all_players()
    else:
        print(f"\nScraping with {remaining} requests available...")
        players = scrape_all_leagues()

    if players:
        print(f"\nTop 10 scorers:")
        for p in sorted(players, key=lambda x: x["goals"], reverse=True)[:10]:
            print(
                f"  {p['name']} ({p['team']}) - "
                f"{p['goals']}G {p['assists']}A | "
                f"xG: {p.get('xG', 0)} xA: {p.get('xA', 0)} | "
                f"Tackles: {p['tacklesTotal']} | "
                f"Duels: {p['duelsWon']}/{p['duelsTotal']} | "
                f"Rating: {p['rating']}"
            )

        print(f"\nTop 5 xG overperformers:")
        overperformers = [
            p for p in players
            if p.get("xG", 0) > 0
        ]
        for p in sorted(overperformers, key=lambda x: x["goals"] - x.get("xG", 0), reverse=True)[:5]:
            diff = p["goals"] - p.get("xG", 0)
            print(f"  {p['name']} ({p['team']}) - Goals: {p['goals']} xG: {p.get('xG',0)} Diff: +{diff:.1f}")

        print(f"\nTop 5 defenders (by tackles):")
        defenders = [p for p in players if p["position"] == "Defender"]
        for p in sorted(defenders, key=lambda x: x["tacklesTotal"], reverse=True)[:5]:
            print(
                f"  {p['name']} ({p['team']}) - "
                f"Tackles: {p['tacklesTotal']} | Blocks: {p['blocks']} | "
                f"Int: {p['interceptions']} | Duels: {p['duelWinPct']}%"
            )

        print(f"\nTop 5 goalkeepers (by saves):")
        gks = [p for p in players if p["position"] == "Goalkeeper"]
        for p in sorted(gks, key=lambda x: x["saves"], reverse=True)[:5]:
            print(
                f"  {p['name']} ({p['team']}) - "
                f"Saves: {p['saves']} | Conceded: {p['goalsConceded']} | "
                f"Rating: {p['rating']}"
            )
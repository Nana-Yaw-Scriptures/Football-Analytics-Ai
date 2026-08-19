"""
Fetches complete player stats from API-Football (api-sports.io).
Free tier: 100 requests/day. Each league ~26 requests.
Caches to JSON so you only scrape once per day.
Save as: services/api_football_scraper.py
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
from services.season import SEASON # 2024-2025 season (API uses start year)

HEADERS = {"x-apisports-key": API_KEY}

LEAGUES = {
    "Premier League": 39,
    "La Liga": 140,
    "Bundesliga": 78,
    "Serie A": 135,
    "Ligue 1": 61,
    "Primeira Liga": 94,
     "Champions League": 2,
}

os.makedirs(CACHE_DIR, exist_ok=True)


def _get(endpoint, params=None):
    """Make API request with rate limiting"""
    url = f"{BASE_URL}/{endpoint}"
    resp = requests.get(url, headers=HEADERS, params=params)
    data = resp.json()
    
    if data.get("errors"):
        print(f"  API Error: {data['errors']}")
    
    return data


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


def scrape_league_players(league_name, league_id):
    """Scrape all players for a league with full stats"""
    # Check cache first
    if _is_cache_fresh(league_name):
        print(f"  {league_name}: Using cached data")
        with open(_cache_path(league_name), "r") as f:
            return json.load(f)
    
    print(f"  {league_name}: Fetching from API...")
    all_players = []
    page = 1
    total_pages = 1
    
    while page <= total_pages:
        data = _get("players", {
            "league": league_id,
            "season": SEASON,
            "page": page
        })
        
        if not data.get("response"):
            break
        
        total_pages = data.get("paging", {}).get("total", 1)
        
        for entry in data["response"]:
            player_info = entry.get("player", {})
            stats_list = entry.get("statistics", [])
            
            if not stats_list:
                continue
            
            stats = stats_list[0]
            games = stats.get("games", {})
            
            # Skip players with no appearances
            if not games.get("appearences") or games["appearences"] < 1:
                continue
            
            shots = stats.get("shots", {})
            goals = stats.get("goals", {})
            passes = stats.get("passes", {})
            tackles = stats.get("tackles", {})
            duels = stats.get("duels", {})
            dribbles = stats.get("dribbles", {})
            fouls = stats.get("fouls", {})
            cards = stats.get("cards", {})
            penalty = stats.get("penalty", {})
            
            appearances = games.get("appearences", 0) or 0
            minutes = games.get("minutes", 0) or 0
            
            player = {
                "id": player_info.get("id"),
                "name": player_info.get("name", ""),
                "firstName": player_info.get("firstname", ""),
                "lastName": player_info.get("lastname", ""),
                "age": player_info.get("age", 0),
                "nationality": player_info.get("nationality", ""),
                "height": player_info.get("height", ""),
                "weight": player_info.get("weight", ""),
                "photo": player_info.get("photo", ""),
                "team": stats.get("team", {}).get("name", ""),
                "teamLogo": stats.get("team", {}).get("logo", ""),
                "league": league_name,
                "position": games.get("position", "Unknown"),
                "rating": float(games.get("rating") or 0),
                
                # Appearances
                "appearances": appearances,
                "lineups": games.get("lineups", 0) or 0,
                "minutes": minutes,
                "minsPerGame": round(minutes / max(appearances, 1), 1),
                
                # Goals & Assists
                "goals": goals.get("total", 0) or 0,
                "assists": goals.get("assists", 0) or 0,
                "goalsConceded": goals.get("conceded", 0) or 0,
                "saves": goals.get("saves", 0) or 0,
                
                # Shooting
                "shotsTotal": shots.get("total", 0) or 0,
                "shotsOnTarget": shots.get("on", 0) or 0,
                "shotAccuracy": round((shots.get("on", 0) or 0) / max(shots.get("total", 1) or 1, 1) * 100, 1),
                
                # Passing
                "passesTotal": passes.get("total", 0) or 0,
                "keyPasses": passes.get("key", 0) or 0,
                "passAccuracy": float(passes.get("accuracy") or 0),
                
                # Defending
                "tacklesTotal": tackles.get("total", 0) or 0,
                "blocks": tackles.get("blocks", 0) or 0,
                "interceptions": tackles.get("interceptions", 0) or 0,
                
                # Duels
                "duelsTotal": duels.get("total", 0) or 0,
                "duelsWon": duels.get("won", 0) or 0,
                "duelWinPct": round((duels.get("won", 0) or 0) / max(duels.get("total", 1) or 1, 1) * 100, 1),
                
                # Dribbles
                "dribblesAttempted": dribbles.get("attempts", 0) or 0,
                "dribblesSuccessful": dribbles.get("success", 0) or 0,
                "dribbleSuccessPct": round((dribbles.get("success", 0) or 0) / max(dribbles.get("attempts", 1) or 1, 1) * 100, 1),
                "dribbledPast": dribbles.get("past", 0) or 0,
                
                # Fouls
                "foulsDrawn": fouls.get("drawn", 0) or 0,
                "foulsCommitted": fouls.get("committed", 0) or 0,
                
                # Cards
                "yellowCards": cards.get("yellow", 0) or 0,
                "redCards": cards.get("red", 0) or 0,
                
                # Penalties
                "penaltiesWon": penalty.get("won", 0) or 0,
                "penaltiesScored": penalty.get("scored", 0) or 0,
                "penaltiesMissed": penalty.get("missed", 0) or 0,
                "penaltiesSaved": penalty.get("saved", 0) or 0,
                
                # Per 90 stats
                "goalsPerNinety": round((goals.get("total", 0) or 0) / max(minutes, 1) * 90, 2),
                "assistsPerNinety": round((goals.get("assists", 0) or 0) / max(minutes, 1) * 90, 2),
                "tacklesPerNinety": round((tackles.get("total", 0) or 0) / max(minutes, 1) * 90, 2),
                "duelsPerNinety": round((duels.get("total", 0) or 0) / max(minutes, 1) * 90, 2),
            }
            
            all_players.append(player)
        
        print(f"    Page {page}/{total_pages} ({len(all_players)} players)")
        page += 1
        time.sleep(1)  # Rate limit
    
    # Cache results
    with open(_cache_path(league_name), "w") as f:
        json.dump(all_players, f)
    
    print(f"  {league_name}: {len(all_players)} players cached")
    return all_players


def scrape_all_leagues():
    """Scrape all 7 leagues. Uses ~100 requests."""
    remaining = check_requests_remaining()
    
    all_players = []
    
    for league_name, league_id in LEAGUES.items():
        if _is_cache_fresh(league_name):
            with open(_cache_path(league_name), "r") as f:
                players = json.load(f)
            print(f"  {league_name}: {len(players)} players (cached)")
            all_players.extend(players)
            continue
        
        if remaining < 30:
            print(f"  {league_name}: Skipped (only {remaining} requests left)")
            continue
        
        players = scrape_league_players(league_name, league_id)
        all_players.extend(players)
        
        # Update remaining
        remaining = check_requests_remaining()
    
    all_players.sort(key=lambda x: x.get("goals", 0), reverse=True)
    print(f"\nTotal: {len(all_players)} players")
    return all_players


def get_all_players():
    """Get all players — from cache if available, scrape if not"""
    all_players = []
    
    for league_name, league_id in LEAGUES.items():
        cache = _cache_path(league_name)
        if os.path.exists(cache):
            with open(cache, "r") as f:
                players = json.load(f)
            all_players.extend(players)
        else:
            print(f"  No cache for {league_name}. Run scrape first.")
    
    all_players.sort(key=lambda x: x.get("goals", 0), reverse=True)
    return all_players


def enrich_understat_players(understat_players, api_football_players):
    """Merge API-Football stats into Understat players"""
    # Build lookup by name + team
    lookup = {}
    for p in api_football_players:
        name = p.get("name", "").lower()
        team = p.get("team", "").lower()
        lookup[f"{name}_{team}"] = p
        # Also by last name + team
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
            # Add API-Football fields without overwriting
            for k in ["tacklesTotal", "blocks", "interceptions", "duelsTotal", "duelsWon", 
                       "duelWinPct", "dribblesAttempted", "dribblesSuccessful", "dribbleSuccessPct",
                       "dribbledPast", "passesTotal", "passAccuracy", "foulsDrawn", "foulsCommitted",
                       "saves", "goalsConceded", "penaltiesSaved", "rating", "photo", "teamLogo",
                       "tacklesPerNinety", "duelsPerNinety", "height", "weight", "nationality"]:
                if k not in player and k in af:
                    player[k] = af[k]
            enriched += 1
    
    print(f"Enriched {enriched}/{len(understat_players)} players with API-Football data")
    return understat_players


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
        # Start with EPL to test
        players = scrape_league_players("Premier League", LEAGUES["Premier League"])
    
    if players:
        print(f"\nTop 10 scorers:")
        for p in sorted(players, key=lambda x: x["goals"], reverse=True)[:10]:
            print(f"  {p['name']} ({p['team']}) - {p['goals']}G {p['assists']}A | Tackles: {p['tacklesTotal']} | Duels: {p['duelsWon']}/{p['duelsTotal']} | Rating: {p['rating']}")
        
        print(f"\nTop 5 defenders (by tackles):")
        defenders = [p for p in players if p["position"] == "Defender"]
        for p in sorted(defenders, key=lambda x: x["tacklesTotal"], reverse=True)[:5]:
            print(f"  {p['name']} ({p['team']}) - Tackles: {p['tacklesTotal']} | Blocks: {p['blocks']} | Int: {p['interceptions']} | Duels: {p['duelWinPct']}%")
        
        print(f"\nTop 5 goalkeepers (by saves):")
        gks = [p for p in players if p["position"] == "Goalkeeper"]
        for p in sorted(gks, key=lambda x: x["saves"], reverse=True)[:5]:
            print(f"  {p['name']} ({p['team']}) - Saves: {p['saves']} | Conceded: {p['goalsConceded']} | Rating: {p['rating']}")
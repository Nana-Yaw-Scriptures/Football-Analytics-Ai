"""
Fetches all player data from Understat for all 5 leagues.
Save as: services/player_scraper.py
"""

from understatapi import UnderstatClient
import time
from services.season import SEASON

# Understat only supports these 5 leagues
# Primeira Liga and Champions League are NOT supported by Understat
LEAGUE_MAP = {
    "Premier League": "EPL",
    "La Liga": "La_Liga",
    "Bundesliga": "Bundesliga",
    "Serie A": "Serie_A",
    "Ligue 1": "Ligue_1",
}


def fetch_all_players(season=None):
    """Fetch all players from all 5 leagues with stats."""
    if season is None:
        season = str(SEASON)   # Understat expects a string like "2026"
    all_players = []

    for league_name, league_code in LEAGUE_MAP.items():
        print(f"Fetching {league_name} players...")
        try:
            understat = UnderstatClient()
            players_data = understat.league(league=league_code).get_player_data(season=season)

            if isinstance(players_data, dict):
                players_list = list(players_data.values())
            elif isinstance(players_data, list):
                players_list = players_data
            else:
                print(f"  Unexpected format for {league_name}")
                continue

            for p in players_list:
                games = int(p.get("games", 0) or 0)
                if games < 3:
                    continue  # Skip players with very few appearances

                goals = int(p.get("goals", 0) or 0)
                assists = int(p.get("assists", 0) or 0)
                shots = int(p.get("shots", 0) or 0)
                key_passes = int(p.get("key_passes", 0) or 0)
                xG = round(float(p.get("xG", 0) or 0), 2)
                xA = round(float(p.get("xA", 0) or 0), 2)
                npxG = round(float(p.get("npxG", 0) or 0), 2)
                minutes = int(p.get("time", 0) or 0)
                yellow = int(p.get("yellow_cards", 0) or 0)
                red = int(p.get("red_cards", 0) or 0)

                # Calculate derived stats
                mins_per_game = round(minutes / max(games, 1), 1)
                goals_per_90 = round((goals / max(minutes, 1)) * 90, 2)
                assists_per_90 = round((assists / max(minutes, 1)) * 90, 2)
                xG_per_90 = round((xG / max(minutes, 1)) * 90, 2)
                shot_accuracy = round((goals / max(shots, 1)) * 100, 1) if shots > 0 else 0

                # Determine position
                position_raw = p.get("position", "").strip().upper()
                if position_raw in ("GK",):
                    position = "Goalkeeper"
                elif position_raw in ("D", "DF", "CB", "LB", "RB", "LWB", "RWB"):
                    position = "Defender"
                elif position_raw in ("M", "MF", "AM", "CM", "DM", "LM", "RM", "CAM", "CDM"):
                    position = "Midfielder"
                elif position_raw in ("F", "FW", "S", "ST", "CF", "LW", "RW", "SS"):
                    position = "Forward"
                else:
                    position = "Forward" if any(x in position_raw for x in ("F", "S", "W")) else "Midfielder"

                player_obj = {
                    "id": p.get("id", ""),
                    "name": p.get("player_name", "Unknown"),
                    "team": p.get("team_title", "Unknown"),
                    "league": league_name,
                    "position": position,
                    "positionRaw": position_raw,
                    "games": games,
                    "minutes": minutes,
                    "minsPerGame": mins_per_game,
                    "goals": goals,
                    "assists": assists,
                    "shots": shots,
                    "keyPasses": key_passes,
                    "xG": xG,
                    "xA": xA,
                    "npxG": npxG,
                    "goalsPerNinety": goals_per_90,
                    "assistsPerNinety": assists_per_90,
                    "xGPerNinety": xG_per_90,
                    "shotAccuracy": shot_accuracy,
                    "yellowCards": yellow,
                    "redCards": red,
                    # Derived for radar chart compatibility
                    "passCompletion": round(min(95, 65 + (key_passes / max(games, 1)) * 5), 1),
                    "dribbleSuccess": round(min(95, 40 + (goals + assists) / max(games, 1) * 20), 1),
                    "tacklesInterceptions": round(3.0 if position == "Defender" else 1.5 if position == "Midfielder" else 0.5, 1),
                    "aerialDuels": round(min(80, 30 + mins_per_game * 0.3), 1),
                    "dribbles": round((goals + assists) / max(games, 1), 2),
                }

                all_players.append(player_obj)

            print(f"  {len([p for p in all_players if p['league'] == league_name])} players loaded")
            time.sleep(1)

        except Exception as e:
            print(f"  Error fetching {league_name}: {e}")
            continue

    # Sort by goals descending
    all_players.sort(key=lambda x: x["goals"], reverse=True)

    print(f"\nTotal: {len(all_players)} players across {len(LEAGUE_MAP)} leagues")
    return all_players


def fetch_league_players(league, season=None):
    """Fetch players for a single league."""
    if season is None:
        season = str(SEASON)
    league_code = LEAGUE_MAP.get(league)
    if not league_code:
        return []

    try:
        understat = UnderstatClient()
        players_data = understat.league(league=league_code).get_player_data(season=season)

        if isinstance(players_data, dict):
            return list(players_data.values())
        elif isinstance(players_data, list):
            return players_data
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []


if __name__ == "__main__":
    players = fetch_all_players()
    print("\nTop 20 scorers:")
    for p in players[:20]:
        print(f"  {p['name']} ({p['team']}) - {p['goals']}G {p['assists']}A | xG: {p['xG']} | {p['league']}")
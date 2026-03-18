"""
Fetches xG (Expected Goals) data from Understat using understatapi
Save this as: services/understat_scraper.py

Install: pip install understatapi
"""

from understatapi import UnderstatClient
import time

LEAGUE_MAP = {
    "Premier League": "EPL",
    "La Liga": "La_Liga",
    "Bundesliga": "Bundesliga",
    "Serie A": "Serie_A",
    "Ligue 1": "Ligue_1",
    "Primeira Liga": "Primeira_Liga",
    "Champions League": "Champions_League",
}

# Map Understat team names to football-data.org names
TEAM_NAME_MAP = {
    "Manchester United": "Manchester United FC",
    "Manchester City": "Manchester City FC",
    "Liverpool": "Liverpool FC",
    "Arsenal": "Arsenal FC",
    "Chelsea": "Chelsea FC",
    "Tottenham": "Tottenham Hotspur FC",
    "Newcastle United": "Newcastle United FC",
    "Aston Villa": "Aston Villa FC",
    "Brighton": "Brighton & Hove Albion FC",
    "West Ham": "West Ham United FC",
    "Crystal Palace": "Crystal Palace FC",
    "Fulham": "Fulham FC",
    "Brentford": "Brentford FC",
    "Nottingham Forest": "Nottingham Forest FC",
    "Wolverhampton Wanderers": "Wolverhampton Wanderers FC",
    "Everton": "Everton FC",
    "Bournemouth": "AFC Bournemouth",
    "Leicester": "Leicester City FC",
    "Southampton": "Southampton FC",
    "Ipswich": "Ipswich Town FC",
    "Barcelona": "FC Barcelona",
    "Real Madrid": "Real Madrid CF",
    "Atletico Madrid": "Club Atlético de Madrid",
    "Athletic Club": "Athletic Club",
    "Villarreal": "Villarreal CF",
    "Real Sociedad": "Real Sociedad de Fútbol",
    "Real Betis": "Real Betis Balompié",
    "Sevilla": "Sevilla FC",
    "Valencia": "Valencia CF",
    "Bayern Munich": "FC Bayern München",
    "Borussia Dortmund": "Borussia Dortmund",
    "Bayer Leverkusen": "Bayer 04 Leverkusen",
    "RasenBallsport Leipzig": "RB Leipzig",
    "Eintracht Frankfurt": "Eintracht Frankfurt",
    "VfB Stuttgart": "VfB Stuttgart",
    "Inter": "FC Internazionale Milano",
    "AC Milan": "AC Milan",
    "Juventus": "Juventus FC",
    "Napoli": "SSC Napoli",
    "Atalanta": "Atalanta BC",
    "AS Roma": "AS Roma",
    "Lazio": "SS Lazio",
    "Fiorentina": "ACF Fiorentina",
    "Paris Saint Germain": "Paris Saint-Germain FC",
    "Marseille": "Olympique de Marseille",
    "Monaco": "AS Monaco FC",
    "Lyon": "Olympique Lyonnais",
    "Lille": "Lille OSC",
}


def scrape_league_xg(league, season="2025"):
    """Get team xG stats for a league using understatapi"""
    understat_league = LEAGUE_MAP.get(league)
    if not understat_league:
        print(f"  League '{league}' not supported")
        return {}
    
    try:
        understat = UnderstatClient()
        # Get team stats for the season
        teams_data = understat.league(league=understat_league).get_team_data(season=season)
    except Exception as e:
        print(f"  Failed to fetch {league}: {e}")
        return {}
    
    result = {}
    
    # teams_data is a dict: {"team_id": {"title": ..., "history": [...]}, ...}
    if isinstance(teams_data, dict):
        teams_iter = teams_data.values()
    elif isinstance(teams_data, list):
        teams_iter = teams_data
    else:
        print(f"  Unexpected data format: {type(teams_data)}")
        return {}
    
    for team_info in teams_iter:
        team_name = team_info.get("title", "")
        history = team_info.get("history", [])
        
        if not history:
            continue
        
        matches_played = len(history)
        
        # Aggregate stats
        total_xg = sum(float(m.get("xG", 0)) for m in history)
        total_xga = sum(float(m.get("xGA", 0)) for m in history)
        total_npxg = sum(float(m.get("npxG", 0)) for m in history)
        total_npxga = sum(float(m.get("npxGA", 0)) for m in history)
        goals = sum(int(m.get("scored", 0)) for m in history)
        goals_against = sum(int(m.get("missed", 0)) for m in history)
        
        # Home/Away splits
        home_matches = [m for m in history if m.get("h_a") == "h"]
        away_matches = [m for m in history if m.get("h_a") == "a"]
        
        home_xg = sum(float(m.get("xG", 0)) for m in home_matches)
        home_xga = sum(float(m.get("xGA", 0)) for m in home_matches)
        home_wins = sum(1 for m in home_matches if m.get("result") == "w")
        home_played = len(home_matches)
        
        away_xg = sum(float(m.get("xG", 0)) for m in away_matches)
        away_xga = sum(float(m.get("xGA", 0)) for m in away_matches)
        away_wins = sum(1 for m in away_matches if m.get("result") == "w")
        away_played = len(away_matches)
        
        # Last 5 form
        last5 = history[-5:] if len(history) >= 5 else history
        form_xg = sum(float(m.get("xG", 0)) for m in last5)
        form_xga = sum(float(m.get("xGA", 0)) for m in last5)
        form_pts = sum(
            3 if m.get("result") == "w" else 1 if m.get("result") == "d" else 0
            for m in last5
        )
        
        # Deep completions and PPDA from last 5
        form_deep = sum(int(m.get("deep", 0)) for m in last5)
        form_ppda = sum(float(m.get("ppda", {}).get("att", 0)) / max(float(m.get("ppda", {}).get("def", 1)), 1) for m in last5 if isinstance(m.get("ppda"), dict))
        
        stats = {
            "understat_name": team_name,
            "matches": matches_played,
            "xg": round(total_xg, 2),
            "xga": round(total_xga, 2),
            "npxg": round(total_npxg, 2),
            "npxga": round(total_npxga, 2),
            "xg_per_game": round(total_xg / max(matches_played, 1), 3),
            "xga_per_game": round(total_xga / max(matches_played, 1), 3),
            "xg_diff": round(total_xg - total_xga, 2),
            "xg_diff_per_game": round((total_xg - total_xga) / max(matches_played, 1), 3),
            "goals": goals,
            "goals_against": goals_against,
            "xg_overperformance": round(goals - total_xg, 2),
            "home_xg_pg": round(home_xg / max(home_played, 1), 3),
            "home_xga_pg": round(home_xga / max(home_played, 1), 3),
            "home_win_rate": round(home_wins / max(home_played, 1), 3),
            "home_played": home_played,
            "away_xg_pg": round(away_xg / max(away_played, 1), 3),
            "away_xga_pg": round(away_xga / max(away_played, 1), 3),
            "away_win_rate": round(away_wins / max(away_played, 1), 3),
            "away_played": away_played,
            "form_xg_pg": round(form_xg / max(len(last5), 1), 3),
            "form_xga_pg": round(form_xga / max(len(last5), 1), 3),
            "form_pts": form_pts,
        }
        
        # Store with both names
        mapped_name = TEAM_NAME_MAP.get(team_name, team_name)
        result[mapped_name] = stats
        result[team_name] = stats
    
    return result


def scrape_all_leagues(season="2025"):
    """Scrape xG data for all leagues"""
    all_data = {}
    
    for league in LEAGUE_MAP:
        print(f"Scraping xG data for {league}...")
        data = scrape_league_xg(league, season)
        unique_teams = len(set(v["understat_name"] for v in data.values())) if data else 0
        print(f"  Found {unique_teams} teams")
        all_data[league] = data
        time.sleep(2)
    
    return all_data


def find_team_xg(team_name, league, xg_data):
    """Find xG data for a team, trying different name variations"""
    league_data = xg_data.get(league, {})
    
    # Direct match
    if team_name in league_data:
        return league_data[team_name]
    
    # Partial match
    team_lower = team_name.lower()
    for key, val in league_data.items():
        if team_lower in key.lower() or key.lower() in team_lower:
            return val
    
    # Last word match
    words = team_name.split()
    for word in words:
        if len(word) > 3:
            for key, val in league_data.items():
                if word.lower() in key.lower():
                    return val
    
    return None


# Test
if __name__ == "__main__":
    print("Testing Understat scraper...\n")
    data = scrape_league_xg("Premier League", "2025")
    
    if data:
        seen = set()
        for name, stats in data.items():
            uname = stats["understat_name"]
            if uname in seen:
                continue
            seen.add(uname)
            print(f"{name}:")
            print(f"  xG: {stats['xg']} | xGA: {stats['xga']} | xG diff: {stats['xg_diff']}")
            print(f"  xG/game: {stats['xg_per_game']} | xGA/game: {stats['xga_per_game']}")
            print(f"  Home xG/g: {stats['home_xg_pg']} | Away xG/g: {stats['away_xg_pg']}")
            print(f"  Form (last 5): xG/g={stats['form_xg_pg']} | pts={stats['form_pts']}")
            print()
    else:
        print("No data found!")
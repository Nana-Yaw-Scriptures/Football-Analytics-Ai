"""
Player Analysis Service — uses API-Football cached data
Save as: services/player_service.py (replaces existing)
"""

import unicodedata
from services.player_detail_service import search_players_cache, get_player_from_cache

# Common name aliases for popular players
PLAYER_ALIASES = {
    "mbappe": "Mbappé", "kylian mbappe": "Mbappé",
    "haaland": "Haaland", "erling haaland": "Haaland",
    "salah": "Salah", "mohamed salah": "Salah", "mo salah": "Salah",
    "messi": "Messi", "lionel messi": "Messi",
    "vinicius": "Vinícius", "vini jr": "Vinícius", "vinicius jr": "Vinícius",
    "rodrygo": "Rodrygo",
    "bellingham": "Bellingham", "jude bellingham": "Bellingham",
    "pedri": "Pedri",
    "gavi": "Gavi",
    "yamal": "Yamal", "lamine yamal": "Yamal",
    "saka": "Saka", "bukayo saka": "Saka",
    "foden": "Foden", "phil foden": "Foden",
    "palmer": "Palmer", "cole palmer": "Palmer",
    "rashford": "Rashford", "marcus rashford": "Rashford",
    "bruno fernandes": "Bruno Fernandes", "bruno": "Bruno Fernandes",
    "de bruyne": "De Bruyne", "kevin de bruyne": "De Bruyne",
    "lewandowski": "Lewandowski", "robert lewandowski": "Lewandowski",
    "raphinha": "Raphinha",
    "griezmann": "Griezmann", "antoine griezmann": "Griezmann",
    "kane": "Kane", "harry kane": "Kane",
    "muller": "Müller", "thomas muller": "Müller", "mueller": "Müller",
    "wirtz": "Wirtz", "florian wirtz": "Wirtz",
    "osimhen": "Osimhen", "victor osimhen": "Osimhen",
    "lautaro": "Lautaro", "lautaro martinez": "Lautaro",
    "vlahovic": "Vlahović", "dusan vlahovic": "Vlahović",
    "szczesny": "Szczęsny",
    "martinez": "Martínez",
    "odegaard": "Ødegaard", "martin odegaard": "Ødegaard",
    "hakimi": "Hakimi", "achraf hakimi": "Hakimi",
    "dembele": "Dembélé", "ousmane dembele": "Dembélé",
    "nkunku": "Nkunku",
    "tchouameni": "Tchouaméni",
}


def _strip_accents(text):
    """Remove accents from text for flexible matching"""
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.category(c).startswith('M'))


def _resolve_player_name(name):
    """Resolve common aliases and strip accents"""
    lower = name.strip().lower()
    return PLAYER_ALIASES.get(lower, name)

# Position-based weight profiles for rating calculation
POSITION_WEIGHTS = {
    "Forward": {"goals": 0.25, "assists": 0.12, "shotsTotal": 0.08, "keyPasses": 0.06, "dribbleSuccessPct": 0.08, "rating": 0.20, "goalsPerNinety": 0.12, "passAccuracy": 0.04, "minutes": 0.05},
    "Midfielder": {"goals": 0.08, "assists": 0.12, "keyPasses": 0.12, "passAccuracy": 0.12, "tacklesTotal": 0.08, "duelsWon": 0.06, "dribbleSuccessPct": 0.06, "rating": 0.20, "interceptions": 0.06, "minutes": 0.05, "goalsPerNinety": 0.05},
    "Defender": {"tacklesTotal": 0.15, "interceptions": 0.12, "blocks": 0.08, "duelsWon": 0.10, "duelWinPct": 0.10, "passAccuracy": 0.08, "rating": 0.20, "goals": 0.04, "minutes": 0.05, "assists": 0.04, "keyPasses": 0.04},
    "Goalkeeper": {"rating": 0.30, "passAccuracy": 0.10, "minutes": 0.10, "saves": 0.20, "goalsConceded": 0.15, "penaltiesSaved": 0.10, "appearances": 0.05},
}


def _safe_float(val, default=0.0):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def _calculate_sub_rating(player, category, max_vals):
    """Calculate a sub-rating (0-10) for a category based on stat percentiles"""
    total = 0
    count = 0
    for stat, max_val in max_vals.items():
        val = _safe_float(player.get(stat, 0))
        if max_val > 0:
            pct = min(val / max_val, 1.0)
            total += pct * 10
            count += 1
    return round(total / max(count, 1), 1)


def _identify_strengths_weaknesses(player, position):
    """Identify top 3 strengths and weaknesses based on stats"""
    strengths = []
    weaknesses = []
    
    rating = _safe_float(player.get("rating", 0))
    goals = _safe_float(player.get("goals", 0))
    assists = _safe_float(player.get("assists", 0))
    appearances = _safe_float(player.get("appearances", 0))
    pass_acc = _safe_float(player.get("passAccuracy", 0))
    tackles = _safe_float(player.get("tacklesTotal", 0))
    interceptions = _safe_float(player.get("interceptions", 0))
    duel_pct = _safe_float(player.get("duelWinPct", 0))
    dribble_pct = _safe_float(player.get("dribbleSuccessPct", 0))
    key_passes = _safe_float(player.get("keyPasses", 0))
    shots = _safe_float(player.get("shotsTotal", 0))
    shot_acc = _safe_float(player.get("shotAccuracy", 0))
    yellows = _safe_float(player.get("yellowCards", 0))
    fouls = _safe_float(player.get("foulsCommitted", 0))
    gpg = _safe_float(player.get("goalsPerNinety", 0))
    
    # Strengths
    if rating >= 7.2:
        strengths.append("Consistently high match ratings")
    if goals >= 10:
        strengths.append(f"Prolific scorer ({int(goals)} goals)")
    elif goals >= 5 and position != "Defender":
        strengths.append(f"Good goal output ({int(goals)} goals)")
    if assists >= 8:
        strengths.append(f"Elite playmaker ({int(assists)} assists)")
    elif assists >= 4:
        strengths.append(f"Creative passing ({int(assists)} assists)")
    if pass_acc >= 88:
        strengths.append(f"Exceptional passing accuracy ({pass_acc}%)")
    elif pass_acc >= 82:
        strengths.append(f"Reliable distribution ({pass_acc}%)")
    if dribble_pct >= 65:
        strengths.append("Excellent dribbler")
    if duel_pct >= 58:
        strengths.append(f"Strong in duels ({duel_pct}% win rate)")
    if tackles >= 50 and position in ["Defender", "Midfielder"]:
        strengths.append(f"Aggressive tackler ({int(tackles)} tackles)")
    if interceptions >= 30 and position in ["Defender", "Midfielder"]:
        strengths.append(f"Sharp reader of the game ({int(interceptions)} interceptions)")
    if key_passes >= 40:
        strengths.append(f"Chance creator ({int(key_passes)} key passes)")
    if shot_acc >= 50 and shots >= 20:
        strengths.append(f"Clinical finisher ({shot_acc}% shot accuracy)")
    if gpg >= 0.5:
        strengths.append(f"Elite goals-per-90 rate ({gpg})")
    
    # Weaknesses
    if rating < 6.8 and rating > 0:
        weaknesses.append("Below-average match ratings")
    if pass_acc < 75 and pass_acc > 0:
        weaknesses.append(f"Inconsistent passing ({pass_acc}%)")
    if duel_pct < 45 and duel_pct > 0:
        weaknesses.append(f"Loses too many duels ({duel_pct}%)")
    if dribble_pct < 45 and dribble_pct > 0 and position in ["Forward", "Midfielder"]:
        weaknesses.append("Dribbling needs improvement")
    if yellows >= 6:
        weaknesses.append(f"Discipline issues ({int(yellows)} yellow cards)")
    if fouls >= 30:
        weaknesses.append(f"Commits too many fouls ({int(fouls)})")
    if shot_acc < 35 and shots >= 15 and position == "Forward":
        weaknesses.append(f"Poor shot accuracy ({shot_acc}%)")
    if goals < 3 and position == "Forward" and appearances >= 10:
        weaknesses.append("Low goal output for a forward")
    if tackles < 15 and position == "Defender" and appearances >= 10:
        weaknesses.append("Low tackling numbers")
    
    return strengths[:4], weaknesses[:3]


def get_player_rating(req, model=None):
    """
    Generate comprehensive player analysis from API-Football cached data.
    The model parameter is kept for API compatibility but not used.
    """
    player_name = req.player_name.strip()
    league = getattr(req, 'league', None) or "Premier League"
    
    # Resolve aliases (mbappe → Mbappé, vini jr → Vinícius, etc.)
    search_name = _resolve_player_name(player_name)
    
    # Search across all leagues first
    results = search_players_cache(search_name, league=None, limit=10)
    
    # If no results, try accent-stripped version
    if not results:
        stripped = _strip_accents(search_name)
        results = search_players_cache(stripped, league=None, limit=10)
    
    # Try just last name
    if not results and ' ' in player_name:
        last_name = player_name.split()[-1]
        resolved_last = _resolve_player_name(last_name)
        results = search_players_cache(resolved_last, league=None, limit=10)
    
    # Try first name
    if not results and ' ' in player_name:
        first_name = player_name.split()[0]
        results = search_players_cache(first_name, league=None, limit=10)
    
    if not results:
        raise ValueError(
            f"Could not find '{player_name}' in any of the top 5 European leagues. "
            f"Please enter a valid player name (e.g., 'Erling Haaland', 'Mbappé', 'Salah')."
        )
    
    # Pick best match
    player = results[0]
    
    position = player.get("position", "Attacker")
    # Normalize position names
    pos_map = {"Attacker": "Forward", "Midfielder": "Midfielder", "Defender": "Defender", "Goalkeeper": "Goalkeeper"}
    position = pos_map.get(position, position)
    
    rating = _safe_float(player.get("rating", 6.5))
    goals = _safe_float(player.get("goals", 0))
    assists = _safe_float(player.get("assists", 0))
    appearances = _safe_float(player.get("appearances", 0))
    minutes = _safe_float(player.get("minutes", 0))
    
    # Fix passAccuracy — if 0 but has passes, estimate from context
    pass_acc = _safe_float(player.get("passAccuracy", 0))
    if pass_acc == 0 and _safe_float(player.get("passesTotal", 0)) > 0:
        # Estimate based on position
        pass_acc = 82.0 if position == "Forward" else 86.0 if position == "Midfielder" else 84.0
    
    # Calculate sub-ratings based on position
    if position == "Forward":
        attacking = min(9.5, (
            min(goals / 20, 1.0) * 3.5 +
            min(_safe_float(player.get("shotsTotal", 0)) / 80, 1.0) * 1.5 +
            min(_safe_float(player.get("shotAccuracy", 0)) / 55, 1.0) * 1.5 +
            min(_safe_float(player.get("goalsPerNinety", 0)) / 0.7, 1.0) * 2.0 +
            min(_safe_float(player.get("dribbleSuccessPct", 0)) / 60, 1.0) * 1.0 +
            min(_safe_float(player.get("keyPasses", 0)) / 40, 1.0) * 0.5
        ))
        defending = min(9.5, (
            min(_safe_float(player.get("tacklesTotal", 0)) / 15, 1.0) * 3.0 +
            min(_safe_float(player.get("interceptions", 0)) / 10, 1.0) * 3.0 +
            min(_safe_float(player.get("duelsWon", 0)) / 40, 1.0) * 2.0 +
            1.5  # Base for effort
        ))
        passing = min(9.5, (
            min(pass_acc / 88, 1.0) * 3.0 +
            min(_safe_float(player.get("keyPasses", 0)) / 50, 1.0) * 3.0 +
            min(assists / 10, 1.0) * 2.5 +
            min(_safe_float(player.get("passesTotal", 0)) / 1000, 1.0) * 1.5
        ))
        physical = min(9.5, (
            min(_safe_float(player.get("duelsWon", 0)) / 80, 1.0) * 2.5 +
            min(_safe_float(player.get("duelWinPct", 0)) / 55, 1.0) * 2.5 +
            min(_safe_float(player.get("dribblesAttempted", 0)) / 80, 1.0) * 2.0 +
            min(minutes / 2000, 1.0) * 2.0 +
            min(_safe_float(player.get("foulsDrawn", 0)) / 30, 1.0) * 1.0
        ))
    elif position == "Midfielder":
        attacking = min(9.5, (
            min(goals / 10, 1.0) * 2.5 +
            min(assists / 10, 1.0) * 2.5 +
            min(_safe_float(player.get("keyPasses", 0)) / 50, 1.0) * 2.5 +
            min(_safe_float(player.get("shotsTotal", 0)) / 40, 1.0) * 1.0 +
            min(_safe_float(player.get("goalsPerNinety", 0)) / 0.35, 1.0) * 1.5
        ))
        defending = min(9.5, (
            min(_safe_float(player.get("tacklesTotal", 0)) / 50, 1.0) * 2.5 +
            min(_safe_float(player.get("interceptions", 0)) / 30, 1.0) * 2.5 +
            min(_safe_float(player.get("duelsWon", 0)) / 80, 1.0) * 2.0 +
            min(_safe_float(player.get("duelWinPct", 0)) / 55, 1.0) * 2.0 +
            1.0
        ))
        passing = min(9.5, (
            min(pass_acc / 90, 1.0) * 3.0 +
            min(_safe_float(player.get("keyPasses", 0)) / 60, 1.0) * 3.0 +
            min(assists / 10, 1.0) * 2.0 +
            min(_safe_float(player.get("passesTotal", 0)) / 1200, 1.0) * 2.0
        ))
        physical = min(9.5, (
            min(_safe_float(player.get("duelsWon", 0)) / 100, 1.0) * 3.0 +
            min(_safe_float(player.get("duelWinPct", 0)) / 55, 1.0) * 2.5 +
            min(minutes / 2000, 1.0) * 2.0 +
            min(_safe_float(player.get("foulsDrawn", 0)) / 30, 1.0) * 1.5 +
            1.0
        ))
    elif position == "Defender":
        attacking = min(9.5, (
            min(goals / 4, 1.0) * 2.5 +
            min(assists / 4, 1.0) * 2.5 +
            min(_safe_float(player.get("keyPasses", 0)) / 15, 1.0) * 2.0 +
            2.0  # Base
        ))
        defending = min(9.5, (
            min(_safe_float(player.get("tacklesTotal", 0)) / 60, 1.0) * 2.5 +
            min(_safe_float(player.get("interceptions", 0)) / 40, 1.0) * 2.5 +
            min(_safe_float(player.get("blocks", 0)) / 15, 1.0) * 1.5 +
            min(_safe_float(player.get("duelsWon", 0)) / 100, 1.0) * 2.0 +
            min(_safe_float(player.get("duelWinPct", 0)) / 60, 1.0) * 1.5
        ))
        passing = min(9.5, (
            min(pass_acc / 90, 1.0) * 4.0 +
            min(_safe_float(player.get("keyPasses", 0)) / 20, 1.0) * 2.0 +
            min(_safe_float(player.get("passesTotal", 0)) / 1500, 1.0) * 2.0 +
            2.0
        ))
        physical = min(9.5, (
            min(_safe_float(player.get("duelsWon", 0)) / 120, 1.0) * 3.0 +
            min(_safe_float(player.get("duelWinPct", 0)) / 60, 1.0) * 3.0 +
            min(minutes / 2200, 1.0) * 2.0 +
            2.0
        ))
    else:  # Goalkeeper
        attacking = 2.0
        defending = min(9.5, (
            min(_safe_float(player.get("saves", 0)) / 80, 1.0) * 4.0 +
            min(appearances / 20, 1.0) * 2.0 +
            3.0
        ))
        passing = min(9.5, (
            min(pass_acc / 80, 1.0) * 5.0 +
            3.0
        ))
        physical = min(9.5, (
            min(minutes / 2000, 1.0) * 4.0 +
            min(appearances / 22, 1.0) * 3.0 +
            2.0
        ))
    
    # Overall rating — heavily weighted by API match rating
    if rating >= 6.0:
        overall = (rating * 0.55) + (attacking * 0.15) + (defending * 0.05) + (passing * 0.12) + (physical * 0.08) + 0.5
    else:
        overall = (attacking * 0.30) + (defending * 0.20) + (passing * 0.25) + (physical * 0.15) + 1.5
    
    # Clamp ratings
    overall = max(3.0, min(9.5, overall))
    attacking = max(2.0, min(9.5, attacking))
    defending = max(2.0, min(9.5, defending))
    passing = max(2.0, min(9.5, passing))
    physical = max(2.0, min(9.5, physical))
    
    strengths, weaknesses = _identify_strengths_weaknesses(player, position)
    
    # Override passAccuracy with estimated value for display
    display_pass_acc = pass_acc
    
    if not strengths:
        strengths = ["Consistent performer"]
    if not weaknesses:
        weaknesses = ["No significant weaknesses identified"]
    
    return {
        "player_name": player.get("name", player_name),
        "overall_rating": round(overall, 1),
        "attacking": round(attacking, 1),
        "defending": round(defending, 1),
        "passing": round(passing, 1),
        "physical": round(physical, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        # Extra data for enhanced UI
        "position": position,
        "team": player.get("team", ""),
        "teamLogo": player.get("teamLogo", ""),
        "photo": player.get("photo", ""),
        "nationality": player.get("nationality", ""),
        "age": player.get("age", 0),
        "league": player.get("league", ""),
        "appearances": int(appearances),
        "goals": int(goals),
        "assists": int(assists),
        "minutes": int(minutes),
        "rating": round(rating, 2),
        "keyPasses": int(_safe_float(player.get("keyPasses", 0))),
        "tacklesTotal": int(_safe_float(player.get("tacklesTotal", 0))),
        "interceptions": int(_safe_float(player.get("interceptions", 0))),
        "duelWinPct": round(_safe_float(player.get("duelWinPct", 0)), 1),
        "passAccuracy": round(display_pass_acc, 1),
        "shotsTotal": int(_safe_float(player.get("shotsTotal", 0))),
        "shotAccuracy": round(_safe_float(player.get("shotAccuracy", 0)), 1),
        "goalsPerNinety": round(_safe_float(player.get("goalsPerNinety", 0)), 2),
        "assistsPerNinety": round(_safe_float(player.get("assistsPerNinety", 0)), 2),
        "dribbleSuccessPct": round(_safe_float(player.get("dribbleSuccessPct", 0)), 1),
        "dribblesAttempted": int(_safe_float(player.get("dribblesAttempted", 0))),
        "dribblesSuccessful": int(_safe_float(player.get("dribblesSuccessful", 0))),
        "foulsDrawn": int(_safe_float(player.get("foulsDrawn", 0))),
        "foulsCommitted": int(_safe_float(player.get("foulsCommitted", 0))),
        "yellowCards": int(_safe_float(player.get("yellowCards", 0))),
        "redCards": int(_safe_float(player.get("redCards", 0))),
        "blocks": int(_safe_float(player.get("blocks", 0))),
        "duelsTotal": int(_safe_float(player.get("duelsTotal", 0))),
        "duelsWon": int(_safe_float(player.get("duelsWon", 0))),
        "penaltiesScored": int(_safe_float(player.get("penaltiesScored", 0))),
        "penaltiesMissed": int(_safe_float(player.get("penaltiesMissed", 0))),
    }
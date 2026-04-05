"""
Prediction History & Accuracy Tracker
Stores match predictions, resolves actual results, calculates hit rate.
Save as: football-analyst-backend/services/prediction_history_service.py
"""

import json, os, time, requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

CACHE_DIR   = "cache"
HISTORY_DIR = "picks_only"   # volume-backed — survives Railway restarts
HISTORY_FILE = os.path.join(HISTORY_DIR, "prediction_history.json")
os.makedirs(CACHE_DIR,   exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL = "https://v3.football.api-sports.io"


def _load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_history(data):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def save_prediction(prediction):
    """
    Save a new prediction. Expected format:
    {
        "homeTeam": "Arsenal",
        "awayTeam": "Chelsea",
        "league": "Premier League",
        "homeWinProb": 0.55,
        "drawProb": 0.25,
        "awayWinProb": 0.20,
        "predictedOutcome": "Arsenal Win",
        "predictedScore": "2-1",
        "confidence": 0.55,
        "fixtureId": 12345 (optional),
        "matchDate": "2026-02-20" (optional),
    }
    """
    history = _load_history()

    # Determine predicted result
    hw = prediction.get("homeWinProb", prediction.get("home_win", 0))
    dr = prediction.get("drawProb", prediction.get("draw", 0))
    aw = prediction.get("awayWinProb", prediction.get("away_win", 0))

    if hw >= dr and hw >= aw:
        predicted_result = "H"
    elif dr >= hw and dr >= aw:
        predicted_result = "D"
    else:
        predicted_result = "A"

    import uuid
    entry = {
        "id": str(uuid.uuid4())[:8],  # unique ID — safe after deletes
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "homeTeam": prediction.get("homeTeam", prediction.get("home_team", "")),
        "awayTeam": prediction.get("awayTeam", prediction.get("away_team", "")),
        "league": prediction.get("league", ""),
        "homeWinProb": round(hw, 3),
        "drawProb": round(dr, 3),
        "awayWinProb": round(aw, 3),
        "predictedResult": predicted_result,
        "predictedOutcome": prediction.get("predictedOutcome", prediction.get("predicted_outcome", "")),
        "predictedScore": prediction.get("predictedScore", prediction.get("predicted_score", "")),
        "confidence": round(max(hw, dr, aw), 3),
        "fixtureId": prediction.get("fixtureId", None),
        "matchDate": prediction.get("matchDate", None),
        # To be filled after match
        "actualResult": None,
        "actualScore": None,
        "correct": None,
        "scoreCorrect": None,
        "resolved": False,
    }

    # Avoid duplicates (same teams within 24 hours)
    for existing in history[-50:]:
        if (existing["homeTeam"] == entry["homeTeam"] and
            existing["awayTeam"] == entry["awayTeam"] and
            not existing["resolved"]):
            # Update the existing prediction
            existing.update({
                "homeWinProb": entry["homeWinProb"],
                "drawProb": entry["drawProb"],
                "awayWinProb": entry["awayWinProb"],
                "predictedResult": entry["predictedResult"],
                "predictedOutcome": entry["predictedOutcome"],
                "predictedScore": entry["predictedScore"],
                "confidence": entry["confidence"],
                "timestamp": entry["timestamp"],
            })
            _save_history(history)
            return existing

    history.append(entry)
    _save_history(history)
    return entry


def resolve_predictions():
    """
    Check unresolved predictions against actual results.
    Uses API-Football to get finished fixture results.
    """
    history = _load_history()
    unresolved = [p for p in history if not p["resolved"]]

    if not unresolved:
        return {"resolved": 0, "message": "No predictions to resolve"}

    resolved_count = 0

    for pred in unresolved:
        home = pred["homeTeam"]
        away = pred["awayTeam"]
        league = pred["league"]

        # Try to find the fixture result
        actual = _find_result(home, away, league, pred.get("fixtureId"), pred.get("matchDate"))

        if actual:
            hg = actual["homeGoals"]
            ag = actual["awayGoals"]

            if hg > ag:
                actual_result = "H"
            elif hg == ag:
                actual_result = "D"
            else:
                actual_result = "A"

            pred["actualResult"] = actual_result
            pred["actualScore"] = f"{hg}-{ag}"
            pred["correct"] = pred["predictedResult"] == actual_result
            pred["scoreCorrect"] = pred["predictedScore"] == f"{hg}-{ag}"
            pred["resolved"] = True
            resolved_count += 1

    _save_history(history)
    return {"resolved": resolved_count, "total": len(unresolved)}


def _clean_team(name):
    """Normalize team name for fuzzy matching."""
    import re
    name = name.lower()
    # Remove common suffixes/prefixes
    for pat in [' fc', ' cf', ' sc', ' afc', ' utd', 'fc ', 'club ', 'real ', 'atletico ', 'atlético ']:
        name = name.replace(pat, ' ')
    # Remove accents approximation
    name = name.replace('é','e').replace('á','a').replace('ó','o').replace('ú','u').replace('í','i')
    name = name.replace('è','e').replace('à','a').replace('ò','o').replace('ü','u')
    # Keep only letters and spaces
    name = re.sub(r'[^a-z ]', '', name).strip()
    # Remove common words
    for word in ['de', 'del', 'la', 'los', 'las', 'el', 'united', 'city', 'town']:
        name = re.sub(rf'\b{word}\b', '', name)
    return re.sub(r'\s+', ' ', name).strip()


def _teams_match(pred_name, api_name):
    """Check if two team names refer to the same team."""
    p = _clean_team(pred_name)
    a = _clean_team(api_name)
    if not p or not a:
        return False
    # Direct match
    if p == a:
        return True
    # One contains the other (min 4 chars to avoid false positives)
    if len(p) >= 4 and len(a) >= 4:
        if p in a or a in p:
            return True
    # Share significant word (5+ chars)
    p_words = set(w for w in p.split() if len(w) >= 5)
    a_words = set(w for w in a.split() if len(w) >= 5)
    if p_words & a_words:
        return True
    return False


def _find_result(home, away, league, fixture_id=None, match_date=None):
    """Find actual match result from API-Football."""
    # Method 1: Direct fixture ID lookup
    if fixture_id:
        try:
            resp = requests.get(
                f"{BASE_URL}/fixtures",
                headers={"x-apisports-key": API_KEY},
                params={"id": fixture_id},
                timeout=10,
            )
            data = resp.json()
            for fix in data.get("response", []):
                status = fix.get("fixture", {}).get("status", {}).get("short", "")
                if status in ("FT", "AET", "PEN"):
                    goals = fix.get("goals", {})
                    return {"homeGoals": goals.get("home", 0), "awayGoals": goals.get("away", 0)}
        except Exception as e:
            print(f"[History] Fixture lookup failed: {e}")

    # Method 2: Search by team names in recent finished fixtures
    try:
        from services.live_scores_service import LEAGUE_IDS
        league_id = LEAGUE_IDS.get(league)
        if not league_id:
            print(f"[History] Unknown league: {league}")
            return None

        # Try last 30 to catch more matches
        resp = requests.get(
            f"{BASE_URL}/fixtures",
            headers={"x-apisports-key": API_KEY},
            params={"league": league_id, "season": 2025, "last": 30},
            timeout=10,
        )
        data = resp.json()
        print(f"[History] Searching {len(data.get('response',[]))} fixtures for {home} vs {away}")

        for fix in data.get("response", []):
            status = fix.get("fixture", {}).get("status", {}).get("short", "")
            if status not in ("FT", "AET", "PEN"):
                continue
            teams = fix.get("teams", {})
            h_api = teams.get("home", {}).get("name", "")
            a_api = teams.get("away", {}).get("name", "")

            if _teams_match(home, h_api) and _teams_match(away, a_api):
                goals = fix.get("goals", {})
                print(f"[History] Matched: {h_api} vs {a_api} → {goals}")
                return {"homeGoals": goals.get("home", 0), "awayGoals": goals.get("away", 0)}

        print(f"[History] No match found for {home} vs {away} in {league}")
    except Exception as e:
        print(f"[History] Search failed: {e}")

    return None


def get_history(limit=50, league=None, resolved_only=False):
    """Get prediction history, newest first."""
    history = _load_history()

    if league:
        history = [p for p in history if p.get("league") == league]
    if resolved_only:
        history = [p for p in history if p.get("resolved")]

    # Sort newest first
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return history[:limit]


def get_accuracy_stats(league=None):
    """Calculate overall prediction accuracy stats."""
    history = _load_history()

    if league:
        history = [p for p in history if p.get("league") == league]

    resolved = [p for p in history if p.get("resolved")]
    total = len(resolved)

    if total == 0:
        return {
            "total": 0,
            "resolved": 0,
            "unresolved": len(history) - total,
            "correct": 0,
            "accuracy": 0,
            "scoreAccuracy": 0,
            "byResult": {"H": {"total": 0, "correct": 0}, "D": {"total": 0, "correct": 0}, "A": {"total": 0, "correct": 0}},
            "byConfidence": [],
            "recentForm": [],
            "avgConfidence": 0,
        }

    correct = sum(1 for p in resolved if p.get("correct"))
    score_correct = sum(1 for p in resolved if p.get("scoreCorrect"))

    # By result type
    by_result = {"H": {"total": 0, "correct": 0}, "D": {"total": 0, "correct": 0}, "A": {"total": 0, "correct": 0}}
    for p in resolved:
        r = p.get("predictedResult", "H")
        by_result[r]["total"] += 1
        if p.get("correct"):
            by_result[r]["correct"] += 1

    for r in by_result:
        t = by_result[r]["total"]
        by_result[r]["accuracy"] = round(by_result[r]["correct"] / t * 100, 1) if t > 0 else 0

    # By confidence buckets
    buckets = [(0, 0.4, "Low"), (0.4, 0.55, "Medium"), (0.55, 0.7, "High"), (0.7, 1.01, "Very High")]
    by_confidence = []
    for low, high, label in buckets:
        in_bucket = [p for p in resolved if low <= p.get("confidence", 0) < high]
        bucket_correct = sum(1 for p in in_bucket if p.get("correct"))
        by_confidence.append({
            "label": label,
            "range": f"{int(low*100)}-{int(high*100)}%",
            "total": len(in_bucket),
            "correct": bucket_correct,
            "accuracy": round(bucket_correct / len(in_bucket) * 100, 1) if in_bucket else 0,
        })

    # Recent form (last 20)
    recent = sorted(resolved, key=lambda x: x.get("timestamp", ""), reverse=True)[:20]
    recent_form = [{"correct": p.get("correct", False), "confidence": p.get("confidence", 0)} for p in recent]

    # Average confidence
    avg_conf = sum(p.get("confidence", 0) for p in resolved) / total

    # Streak
    streak = 0
    for p in sorted(resolved, key=lambda x: x.get("timestamp", ""), reverse=True):
        if p.get("correct"):
            streak += 1
        else:
            break

    return {
        "total": len(history),
        "resolved": total,
        "unresolved": len(history) - total,
        "correct": correct,
        "accuracy": round(correct / total * 100, 1),
        "scoreAccuracy": round(score_correct / total * 100, 1),
        "byResult": by_result,
        "byConfidence": by_confidence,
        "recentForm": recent_form,
        "avgConfidence": round(avg_conf * 100, 1),
        "currentStreak": streak,
    }


def clear_history():
    """Clear all prediction history."""
    _save_history([])
    return {"message": "History cleared"}
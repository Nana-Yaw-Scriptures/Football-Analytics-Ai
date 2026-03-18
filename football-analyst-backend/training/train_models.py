"""
Train all ML models for the Football Analyst AI
Multi-season (2021-2025) with xG + momentum features
Run: python training/train_models.py
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, mean_absolute_error
from xgboost import XGBClassifier, XGBRegressor
import joblib
import os
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.data_fetcher import fetch_matches, fetch_standings, parse_form, calculate_elo, LEAGUE_CODES
from services.understat_scraper import scrape_league_xg, find_team_xg

OUTPUT_DIR = "trained_models"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SEASONS = ["2021", "2022", "2023", "2024","2025"]
LEAGUES_TO_TRAIN = {
    "Premier League": "PL",
    "La Liga": "PD",
    "Bundesliga": "BL1",
    "Serie A": "SA",
    "Ligue 1": "FL1"
}


def estimate_momentum_from_matches(team_name, all_matches, is_home_team):
    """Estimate momentum features from match history for training"""
    # Find last 8 matches involving this team
    team_matches = []
    for _, m in all_matches.iterrows():
        if team_name.lower() in m["home_team"].lower() or team_name.lower() in m["away_team"].lower():
            is_home = team_name.lower() in m["home_team"].lower()
            if m["winner"] == "HOME_TEAM":
                result = "W" if is_home else "L"
            elif m["winner"] == "AWAY_TEAM":
                result = "L" if is_home else "W"
            else:
                result = "D"
            
            gf = m["home_goals"] if is_home else m["away_goals"]
            ga = m["away_goals"] if is_home else m["home_goals"]
            
            team_matches.append({
                "result": result,
                "is_home": is_home,
                "goals_for": gf if gf is not None else 0,
                "goals_against": ga if ga is not None else 0
            })
    
    recent = team_matches[-8:] if len(team_matches) >= 8 else team_matches
    
    if not recent:
        return {k: 0 for k in [
            "recent_ppg", "recent_gpg", "recent_gapg",
            "win_streak", "loss_streak", "unbeaten_streak",
            "recent_wins", "recent_draws", "recent_losses",
            "recent_home_wr", "recent_away_wr", "recent_gd_pg", "form_trend"
        ]}
    
    n = len(recent)
    wins = sum(1 for m in recent if m["result"] == "W")
    draws = sum(1 for m in recent if m["result"] == "D")
    losses = sum(1 for m in recent if m["result"] == "L")
    pts = wins * 3 + draws
    gf = sum(m["goals_for"] for m in recent)
    ga = sum(m["goals_against"] for m in recent)
    
    home_m = [m for m in recent if m["is_home"]]
    away_m = [m for m in recent if not m["is_home"]]
    home_wins = sum(1 for m in home_m if m["result"] == "W")
    away_wins = sum(1 for m in away_m if m["result"] == "W")
    
    # Streaks
    win_streak = 0
    for m in reversed(recent):
        if m["result"] == "W": win_streak += 1
        else: break
    
    loss_streak = 0
    for m in reversed(recent):
        if m["result"] == "L": loss_streak += 1
        else: break
    
    unbeaten_streak = 0
    for m in reversed(recent):
        if m["result"] != "L": unbeaten_streak += 1
        else: break
    
    # Form trend
    if n >= 6:
        last3 = sum(3 if m["result"] == "W" else 1 if m["result"] == "D" else 0 for m in recent[-3:])
        prev3 = sum(3 if m["result"] == "W" else 1 if m["result"] == "D" else 0 for m in recent[-6:-3])
        form_trend = last3 - prev3
    else:
        form_trend = 0
    
    return {
        "recent_ppg": round(pts / n, 3),
        "recent_gpg": round(gf / n, 3),
        "recent_gapg": round(ga / n, 3),
        "win_streak": win_streak,
        "loss_streak": loss_streak,
        "unbeaten_streak": unbeaten_streak,
        "recent_wins": wins,
        "recent_draws": draws,
        "recent_losses": losses,
        "recent_home_wr": round(home_wins / max(len(home_m), 1), 3),
        "recent_away_wr": round(away_wins / max(len(away_m), 1), 3),
        "recent_gd_pg": round((gf - ga) / n, 3),
        "form_trend": form_trend
    }


def train_match_predictor():
    print("\n=== Training Match Predictor (Multi-Season + Momentum) ===")
    
    all_data = []
    
    for season in SEASONS:
        print(f"\n--- Season {season}/{int(season)+1} ---")
        
        print(f"  Fetching xG data...")
        xg_data = {}
        for league in LEAGUES_TO_TRAIN:
            try:
                xg = scrape_league_xg(league, season)
                xg_data[league] = xg
                unique = len(set(v["understat_name"] for v in xg.values())) if xg else 0
                print(f"    {league}: {unique} teams")
            except Exception as e:
                print(f"    {league} xG failed: {e}")
                xg_data[league] = {}
            time.sleep(1)
        
        for league, code in LEAGUES_TO_TRAIN.items():
            print(f"  {league}...")
            try:
                matches = fetch_matches(league, status="FINISHED", limit=400, season=int(season))
                standings = fetch_standings(league, season=int(season))
            except Exception as e:
                print(f"    Skipped: {e}")
                continue
            
            elo_ratings = calculate_elo(standings)
            count = 0
            
            # Sort matches by date for proper momentum calculation
            if "date" in matches.columns:
                matches = matches.sort_values("date").reset_index(drop=True)
            
            for idx, match in matches.iterrows():
                home = match["home_team"]
                away = match["away_team"]
                
                h_row = standings[standings["team"].str.contains(home, case=False)]
                a_row = standings[standings["team"].str.contains(away, case=False)]
                
                if h_row.empty or a_row.empty:
                    continue
                
                h, a = h_row.iloc[0], a_row.iloc[0]
                
                if match["winner"] == "HOME_TEAM":
                    outcome = "HOME_WIN"
                elif match["winner"] == "AWAY_TEAM":
                    outcome = "AWAY_WIN"
                else:
                    outcome = "DRAW"
                
                h_played = max(h["played"], 1)
                a_played = max(a["played"], 1)
                h_ppg = h["points"] / h_played
                a_ppg = a["points"] / a_played
                h_gpg = h["goals_for"] / h_played
                a_gpg = a["goals_for"] / a_played
                h_gapg = h["goals_against"] / h_played
                a_gapg = a["goals_against"] / a_played
                
                h_form_pts, h_form_wins, h_form_losses = parse_form(h.get("form", ""))
                a_form_pts, a_form_wins, a_form_losses = parse_form(a.get("form", ""))
                
                h_elo = elo_ratings.get(h["team"], 1500)
                a_elo = elo_ratings.get(a["team"], 1500)
                
                h_xg = find_team_xg(h["team"], league, xg_data)
                a_xg = find_team_xg(a["team"], league, xg_data)
                
                # Momentum from match history
                matches_before = matches.iloc[:idx] if idx > 0 else matches.iloc[:1]
                h_mom = estimate_momentum_from_matches(home, matches_before, True)
                a_mom = estimate_momentum_from_matches(away, matches_before, False)
                
                row = {
                    "home_position": h["position"],
                    "away_position": a["position"],
                    "home_points": h["points"],
                    "away_points": a["points"],
                    "pos_diff": a["position"] - h["position"],
                    "pts_diff": h["points"] - a["points"],
                    "home_gf": h["goals_for"],
                    "home_ga": h["goals_against"],
                    "away_gf": a["goals_for"],
                    "away_ga": a["goals_against"],
                    "home_gd": h["goal_diff"],
                    "away_gd": a["goal_diff"],
                    "gd_diff": h["goal_diff"] - a["goal_diff"],
                    "home_wr": h["won"] / h_played,
                    "away_wr": a["won"] / a_played,
                    "home_dr": h["draw"] / h_played,
                    "away_dr": a["draw"] / a_played,
                    "home_lr": h["lost"] / h_played,
                    "away_lr": a["lost"] / a_played,
                    "wr_diff": (h["won"] / h_played) - (a["won"] / a_played),
                    "home_ppg": h_ppg,
                    "away_ppg": a_ppg,
                    "ppg_diff": h_ppg - a_ppg,
                    "home_gpg": h_gpg,
                    "away_gpg": a_gpg,
                    "gpg_diff": h_gpg - a_gpg,
                    "home_gapg": h_gapg,
                    "away_gapg": a_gapg,
                    "home_attack_strength": h_gpg / max(a_gapg, 0.1),
                    "away_attack_strength": a_gpg / max(h_gapg, 0.1),
                    "home_defense_strength": a_gapg / max(h_gapg, 0.1),
                    "away_defense_strength": h_gapg / max(a_gapg, 0.1),
                    "overall_strength_ratio": h_ppg / max(a_ppg, 0.1),
                    "home_elo": h_elo,
                    "away_elo": a_elo,
                    "elo_diff": h_elo - a_elo,
                    "home_form_pts": h_form_pts,
                    "away_form_pts": a_form_pts,
                    "form_pts_diff": h_form_pts - a_form_pts,
                    "home_form_wins": h_form_wins,
                    "away_form_wins": a_form_wins,
                    "home_form_losses": h_form_losses,
                    "away_form_losses": a_form_losses,
                    # xG
                    "home_xg_pg": h_xg["xg_per_game"] if h_xg else h_gpg,
                    "away_xg_pg": a_xg["xg_per_game"] if a_xg else a_gpg,
                    "home_xga_pg": h_xg["xga_per_game"] if h_xg else h_gapg,
                    "away_xga_pg": a_xg["xga_per_game"] if a_xg else a_gapg,
                    "xg_diff": (h_xg["xg_diff_per_game"] if h_xg else 0) - (a_xg["xg_diff_per_game"] if a_xg else 0),
                    "home_xg_overperf": h_xg["xg_overperformance"] if h_xg else 0,
                    "away_xg_overperf": a_xg["xg_overperformance"] if a_xg else 0,
                    "home_home_xg_pg": h_xg["home_xg_pg"] if h_xg else h_gpg,
                    "away_away_xg_pg": a_xg["away_xg_pg"] if a_xg else a_gpg,
                    "home_home_xga_pg": h_xg["home_xga_pg"] if h_xg else h_gapg,
                    "away_away_xga_pg": a_xg["away_xga_pg"] if a_xg else a_gapg,
                    "home_form_xg_pg": h_xg["form_xg_pg"] if h_xg else 0,
                    "away_form_xg_pg": a_xg["form_xg_pg"] if a_xg else 0,
                    "home_home_wr": h_xg["home_win_rate"] if h_xg else h["won"] / h_played,
                    "away_away_wr": a_xg["away_win_rate"] if a_xg else a["won"] / a_played,
                    "xg_attack_ratio": (h_xg["home_xg_pg"] if h_xg else h_gpg) / max((a_xg["away_xga_pg"] if a_xg else a_gapg), 0.1),
                    "xg_defense_ratio": (a_xg["away_xg_pg"] if a_xg else a_gpg) / max((h_xg["home_xga_pg"] if h_xg else h_gapg), 0.1),
                    # Momentum
                    "home_recent_ppg": h_mom["recent_ppg"],
                    "away_recent_ppg": a_mom["recent_ppg"],
                    "recent_ppg_diff": h_mom["recent_ppg"] - a_mom["recent_ppg"],
                    "home_recent_gpg": h_mom["recent_gpg"],
                    "away_recent_gpg": a_mom["recent_gpg"],
                    "home_recent_gapg": h_mom["recent_gapg"],
                    "away_recent_gapg": a_mom["recent_gapg"],
                    "home_win_streak": h_mom["win_streak"],
                    "away_win_streak": a_mom["win_streak"],
                    "home_loss_streak": h_mom["loss_streak"],
                    "away_loss_streak": a_mom["loss_streak"],
                    "home_unbeaten_streak": h_mom["unbeaten_streak"],
                    "away_unbeaten_streak": a_mom["unbeaten_streak"],
                    "home_recent_wins": h_mom["recent_wins"],
                    "away_recent_wins": a_mom["recent_wins"],
                    "home_recent_losses": h_mom["recent_losses"],
                    "away_recent_losses": a_mom["recent_losses"],
                    "home_recent_home_wr": h_mom["recent_home_wr"],
                    "away_recent_away_wr": a_mom["recent_away_wr"],
                    "home_recent_gd_pg": h_mom["recent_gd_pg"],
                    "away_recent_gd_pg": a_mom["recent_gd_pg"],
                    "home_form_trend": h_mom["form_trend"],
                    "away_form_trend": a_mom["form_trend"],
                    "momentum_diff": h_mom["recent_ppg"] - a_mom["recent_ppg"],
                    "trend_diff": h_mom["form_trend"] - a_mom["form_trend"],
                    "home_ppg_vs_recent": h_ppg - h_mom["recent_ppg"],
                    "away_ppg_vs_recent": a_ppg - a_mom["recent_ppg"],
                    "outcome": outcome
                }
                
                all_data.append(row)
                count += 1
            
            print(f"    {count} matches (matchdays: {matches['matchday'].min()}-{matches['matchday'].max() if len(matches) > 0 else 0})")
    
    if not all_data:
        print("No data!")
        return
    
    df = pd.DataFrame(all_data)
    print(f"\nTOTAL: {len(df)} samples")
    print(f"Distribution:\n{df['outcome'].value_counts()}")
    print(f"Percentages:\n{(df['outcome'].value_counts(normalize=True) * 100).round(1)}")
    
    le = LabelEncoder()
    df["outcome_encoded"] = le.fit_transform(df["outcome"])
    
    features = [c for c in df.columns if c not in ["outcome", "outcome_encoded"]]
    X, y = df[features], df["outcome_encoded"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # No manual class weights - let the data speak for itself
    # The model should learn home/away/draw patterns from the features
    
    base_model = XGBClassifier(
        n_estimators=500, max_depth=6, learning_rate=0.03,
        min_child_weight=5, subsample=0.8, colsample_bytree=0.7,
        reg_alpha=0.5, reg_lambda=2.0, gamma=0.1,
        random_state=42, eval_metric="mlogloss"
    )
    base_model.fit(X_train, y_train)
    
    print("\nCalibrating...")
    calibrated_model = CalibratedClassifierCV(base_model, cv=5, method="isotonic")
    calibrated_model.fit(X_train, y_train)
    
    y_pred = calibrated_model.predict(X_test)
    print("\nCalibrated Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    cv_scores = cross_val_score(base_model, X, y, cv=5)
    print(f"CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
    
    importance = sorted(zip(features, base_model.feature_importances_), key=lambda x: x[1], reverse=True)
    print("\nTop 20 Features:")
    for feat, imp in importance[:20]:
        print(f"  {feat}: {imp:.4f}")
    
    joblib.dump(calibrated_model, os.path.join(OUTPUT_DIR, "match_predictor.pkl"))
    joblib.dump(le, os.path.join(OUTPUT_DIR, "match_label_encoder.pkl"))
    joblib.dump(features, os.path.join(OUTPUT_DIR, "match_features.pkl"))
    print(f"\nSaved! ({len(features)} features)")


def train_player_rater():
    print("\n=== Training Player Rater ===")
    np.random.seed(42)
    n = 500
    data = pd.DataFrame({
        "goals": np.random.poisson(5, n), "assists": np.random.poisson(4, n),
        "appearances": np.random.randint(10, 40, n), "minutes": np.random.randint(500, 3500, n),
        "pass_accuracy": np.random.uniform(60, 95, n), "tackles_won": np.random.poisson(30, n),
        "interceptions": np.random.poisson(20, n), "aerial_won": np.random.uniform(30, 80, n),
        "dribbles_completed": np.random.poisson(15, n), "key_passes": np.random.poisson(20, n),
    })
    data["rating"] = (data["goals"]*0.25 + data["assists"]*0.15 + data["pass_accuracy"]*0.05 +
                      data["tackles_won"]*0.03 + data["key_passes"]*0.08 + data["dribbles_completed"]*0.05 +
                      (data["minutes"]/data["appearances"])*0.02 + np.random.normal(0, 0.5, n))
    data["rating"] = ((data["rating"] - data["rating"].min()) / (data["rating"].max() - data["rating"].min()) * 10)
    features = [c for c in data.columns if c != "rating"]
    X_train, X_test, y_train, y_test = train_test_split(data[features], data["rating"], test_size=0.2, random_state=42)
    model = GradientBoostingRegressor(n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    print(f"MAE: {mean_absolute_error(y_test, model.predict(X_test)):.3f}")
    joblib.dump(model, os.path.join(OUTPUT_DIR, "player_rater.pkl"))
    joblib.dump(features, os.path.join(OUTPUT_DIR, "player_features.pkl"))


def train_value_estimator():
    print("\n=== Training Value Estimator ===")
    np.random.seed(42)
    n = 600
    data = pd.DataFrame({
        "age": np.random.randint(17, 37, n), "position": np.random.choice(["Forward","Midfielder","Defender","Goalkeeper"], n),
        "league": np.random.choice(["Premier League","La Liga","Bundesliga","Serie A","Ligue 1"], n),
        "goals": np.random.poisson(6, n), "assists": np.random.poisson(4, n),
        "appearances": np.random.randint(5, 40, n), "international_caps": np.random.poisson(15, n),
        "contract_years": np.random.randint(1, 6, n),
    })
    pos_enc, league_enc = LabelEncoder(), LabelEncoder()
    data["position_enc"] = pos_enc.fit_transform(data["position"])
    data["league_enc"] = league_enc.fit_transform(data["league"])
    base = 5 + data["goals"]*2 + data["assists"]*1.5
    age_f = np.where(data["age"]<25, 1.5, np.where(data["age"]<30, 1.0, 0.5))
    lp = np.where(data["league"]=="Premier League", 1.4, 1.0)
    data["value"] = (base*age_f*lp*(1+data["contract_years"]*0.1)*(1+data["international_caps"]*0.01)+np.random.normal(0,3,n)).clip(0.5,200)
    features = ["age","position_enc","league_enc","goals","assists","appearances","international_caps","contract_years"]
    X_train, X_test, y_train, y_test = train_test_split(data[features], data["value"], test_size=0.2, random_state=42)
    model = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    print(f"MAE: €{mean_absolute_error(y_test, model.predict(X_test)):.2f}M")
    joblib.dump(model, os.path.join(OUTPUT_DIR, "value_estimator.pkl"))
    joblib.dump(features, os.path.join(OUTPUT_DIR, "value_features.pkl"))
    joblib.dump(pos_enc, os.path.join(OUTPUT_DIR, "position_encoder.pkl"))
    joblib.dump(league_enc, os.path.join(OUTPUT_DIR, "league_encoder.pkl"))


if __name__ == "__main__":
    print("=" * 60)
    print("FOOTBALL ANALYST AI - MULTI-SEASON + MOMENTUM TRAINING")
    print("=" * 60)
    train_match_predictor()
    train_player_rater()
    train_value_estimator()
    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED AND SAVED!")
    print("=" * 60)
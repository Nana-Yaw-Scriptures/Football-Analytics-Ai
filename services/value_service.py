import joblib
import numpy as np
import os

MODEL_DIR = "trained_models"

def get_value_estimate(req, model=None):
    """Estimate player transfer value using trained ML model"""
    
    if model is None:
        model = joblib.load(os.path.join(MODEL_DIR, "value_estimator.pkl"))
    
    pos_enc = joblib.load(os.path.join(MODEL_DIR, "position_encoder.pkl"))
    league_enc = joblib.load(os.path.join(MODEL_DIR, "league_encoder.pkl"))
    
    # Encode position and league
    try:
        position_encoded = pos_enc.transform([req.position])[0]
    except ValueError:
        position_encoded = 0
    
    try:
        league_encoded = league_enc.transform([req.league])[0]
    except ValueError:
        league_encoded = 0
    
    # Build feature array
    X = np.array([[
        req.age,
        position_encoded,
        league_encoded,
        req.goals,
        req.assists,
        req.appearances,
        0,  # international_caps (not in request, default 0)
        3,  # contract_years (default 3)
    ]])
    
    # Get prediction
    estimated_value = float(model.predict(X)[0])
    estimated_value = max(0.5, estimated_value)
    
    # Calculate range (±20%)
    value_low = estimated_value * 0.8
    value_high = estimated_value * 1.2
    
    # Build value factors
    value_factors = []
    
    if req.age < 23:
        value_factors.append("Young age increases value potential")
    elif req.age > 30:
        value_factors.append("Age over 30 reduces market value")
    
    if req.goals > 15:
        value_factors.append(f"Strong goal record ({req.goals} goals)")
    
    if req.assists > 10:
        value_factors.append(f"Good creative output ({req.assists} assists)")
    
    if req.league == "Premier League":
        value_factors.append("Premier League premium applied")
    
    if req.appearances > 30:
        value_factors.append("Consistent starter with high appearances")
    
    if not value_factors:
        value_factors.append("Standard market valuation")
    
    return {
        "player_name": req.player_name,
        "estimated_value_eur": round(estimated_value, 2),
        "value_range_low": round(value_low, 2),
        "value_range_high": round(value_high, 2),
        "value_factors": value_factors
    }
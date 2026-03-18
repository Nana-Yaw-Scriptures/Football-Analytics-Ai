import joblib

features = joblib.load("trained_models/match_features.pkl")
model = joblib.load("trained_models/match_predictor.pkl")

# Get feature importance from the base model inside calibrated model
base = model.calibrated_classifiers_[0].estimator
importance = sorted(zip(features, base.feature_importances_), key=lambda x: x[1], reverse=True)

print("TOP 20 FEATURES THE MODEL USES:")
for feat, imp in importance[:20]:
    print(f"  {feat}: {imp:.4f}")

print("\nMOMENTUM FEATURES:")
momentum_feats = [f for f in features if "recent" in f or "streak" in f or "trend" in f or "momentum" in f]
for f in momentum_feats:
    idx = features.index(f)
    print(f"  {f}: {base.feature_importances_[idx]:.4f}")
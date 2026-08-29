"""
AI Health Copilot Pro - SAV Model Inference Script
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.2.0 | Integrates trained .sav sklearn models for disease prediction.

Usage (called by server.ts via child_process):
  stdin  → JSON: {"disease_type": "diabetes"|"heart"|"parkinsons", "features": {...}}
  stdout → JSON: {"probability": 0.72, "prediction": 1, "model_name": "...", "disease_type": "..."}
  stderr → error messages if any
"""

import sys
import json
import os
import pickle
import warnings
import numpy as np

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# Resolve model directory relative to THIS file, not cwd
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_PATHS = {
    "diabetes":   os.path.join(MODEL_DIR, "diabetes_model.sav"),
    "heart":      os.path.join(MODEL_DIR, "heart_disease_model.sav"),
    "parkinsons": os.path.join(MODEL_DIR, "parkinsons_model.sav"),
}

# Exact feature order as trained in the notebooks
FEATURE_ORDER = {
    "diabetes": [
        "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
        "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
    ],
    "heart": [
        "age", "sex", "cp", "trestbps", "chol", "fbs",
        "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
    ],
    "parkinsons": [
        "MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)",
        "MDVP:Jitter(%)", "MDVP:Jitter(Abs)", "MDVP:RAP", "MDVP:PPQ",
        "Jitter:DDP", "MDVP:Shimmer", "MDVP:Shimmer(dB)",
        "Shimmer:APQ3", "Shimmer:APQ5", "MDVP:APQ", "Shimmer:DDA",
        "NHR", "HNR", "RPDE", "DFA", "spread1", "spread2", "D2", "PPE"
    ]
}

MODEL_NAMES = {
    "diabetes":   "SVC_Diabetes_v1.0",
    "heart":      "LogisticRegression_Heart_v1.0",
    "parkinsons": "SVC_Parkinsons_v1.0",
}

# Simple in-process cache so the same process can reuse loaded models
_model_cache: dict = {}


def load_model(disease_type: str):
    """Load and cache the .sav model for the given disease type."""
    if disease_type in _model_cache:
        return _model_cache[disease_type]
    path = MODEL_PATHS[disease_type]
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")
    with open(path, "rb") as f:
        model = pickle.load(f)
    _model_cache[disease_type] = model
    return model


def sigmoid(x: float) -> float:
    """Convert SVM decision_function score to [0, 1] probability via sigmoid."""
    return float(1.0 / (1.0 + np.exp(-x)))


def build_feature_vector(disease_type: str, features: dict) -> np.ndarray:
    """
    Build an ordered numpy feature array from the incoming features dict.
    The frontend sends camelCase keys; this function maps them to the
    exact column names the sklearn model was trained on.
    """
    order = FEATURE_ORDER[disease_type]

    # ── Diabetes feature key mapping (camelCase → sklearn column name) ──
    DIABETES_MAP = {
        "Pregnancies":              ["pregnancies", "Pregnancies"],
        "Glucose":                  ["glucose", "Glucose"],
        "BloodPressure":            ["bloodPressure", "blood_pressure", "BloodPressure"],
        "SkinThickness":            ["skinThickness", "skin_thickness", "SkinThickness"],
        "Insulin":                  ["insulin", "Insulin"],
        "BMI":                      ["bmi", "BMI"],
        "DiabetesPedigreeFunction": ["diabetesPedigree", "diabetes_pedigree", "DiabetesPedigreeFunction"],
        "Age":                      ["age", "Age"],
    }

    # ── Heart feature key mapping ──
    HEART_MAP = {
        "age":      ["age"],
        "sex":      ["sex"],
        "cp":       ["cp"],
        "trestbps": ["trestbps", "bloodPressure"],
        "chol":     ["chol"],
        "fbs":      ["fbs"],
        "restecg":  ["restecg"],
        "thalach":  ["thalach"],
        "exang":    ["exang"],
        "oldpeak":  ["oldpeak"],
        "slope":    ["slope"],
        "ca":       ["ca"],
        "thal":     ["thal"],
    }

    # ── Parkinsons feature key mapping ──
    PARKINSONS_MAP = {
        "MDVP:Fo(Hz)":       ["fo", "MDVP:Fo(Hz)"],
        "MDVP:Fhi(Hz)":      ["fhi", "MDVP:Fhi(Hz)"],
        "MDVP:Flo(Hz)":      ["flo", "MDVP:Flo(Hz)"],
        "MDVP:Jitter(%)":    ["jitterPct", "MDVP:Jitter(%)"],
        "MDVP:Jitter(Abs)":  ["jitterAbs", "MDVP:Jitter(Abs)"],
        "MDVP:RAP":          ["rap", "MDVP:RAP"],
        "MDVP:PPQ":          ["ppq", "MDVP:PPQ"],
        "Jitter:DDP":        ["ddp", "Jitter:DDP"],
        "MDVP:Shimmer":      ["shimmer", "MDVP:Shimmer"],
        "MDVP:Shimmer(dB)":  ["shimmerDb", "MDVP:Shimmer(dB)"],
        "Shimmer:APQ3":      ["apq3", "Shimmer:APQ3"],
        "Shimmer:APQ5":      ["apq5", "Shimmer:APQ5"],
        "MDVP:APQ":          ["apq", "MDVP:APQ"],
        "Shimmer:DDA":       ["dda", "Shimmer:DDA"],
        "NHR":               ["nhr", "NHR"],
        "HNR":               ["hnr", "HNR"],
        "RPDE":              ["rpde", "RPDE"],
        "DFA":               ["dfa", "DFA"],
        "spread1":           ["spread1"],
        "spread2":           ["spread2"],
        "D2":                ["d2", "D2"],
        "PPE":               ["ppe", "PPE"],
    }

    KEY_MAP = {
        "diabetes":   DIABETES_MAP,
        "heart":      HEART_MAP,
        "parkinsons": PARKINSONS_MAP,
    }[disease_type]

    row = []
    for col in order:
        aliases = KEY_MAP.get(col, [col])
        val = None
        for alias in aliases:
            if alias in features:
                val = features[alias]
                break
        if val is None:
            raise KeyError(f"Missing feature '{col}' (tried aliases: {aliases}) for {disease_type}")
        row.append(float(val))

    return np.array(row).reshape(1, -1)


def predict(disease_type: str, features: dict) -> dict:
    """
    Run inference using the appropriate .sav model.
    Returns dict with probability, prediction (0/1), model_name.
    """
    if disease_type not in MODEL_PATHS:
        raise ValueError(f"Unknown disease_type: '{disease_type}'. Must be one of: {list(MODEL_PATHS.keys())}")

    model = load_model(disease_type)
    X = build_feature_vector(disease_type, features)

    # Get hard class prediction
    prediction = int(model.predict(X)[0])

    # Get probability estimate
    if hasattr(model, "predict_proba"):
        # LogisticRegression (heart model) supports predict_proba
        proba = float(model.predict_proba(X)[0][1])
    elif hasattr(model, "decision_function"):
        # SVC models: use sigmoid(decision_function) as probability estimate
        df_score = float(model.decision_function(X)[0])
        proba = sigmoid(df_score)
    else:
        # Fallback: binary prediction as probability
        proba = float(prediction)

    # Clamp to valid range
    proba = max(0.01, min(0.99, proba))

    return {
        "probability":  round(proba, 4),
        "prediction":   prediction,
        "model_name":   MODEL_NAMES[disease_type],
        "disease_type": disease_type,
    }


def main():
    """
    Read one JSON object from stdin, run inference, write JSON to stdout.
    Exit 0 on success, exit 1 on error (error JSON on stdout for easy parsing).
    """
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            raise ValueError("Empty stdin — no input data received")

        payload = json.loads(raw)
        disease_type = payload.get("disease_type", "diabetes")
        features = payload.get("features", {})

        result = predict(disease_type, features)
        print(json.dumps(result))
        sys.exit(0)

    except Exception as exc:
        error_payload = {
            "error": str(exc),
            "probability": None,
            "prediction": None,
        }
        print(json.dumps(error_payload))
        sys.exit(1)


if __name__ == "__main__":
    main()

"""
AI Health Copilot Pro - SAV Model Evaluation Script
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.2.0 | Computes real holdout metrics for the trained .sav models.

Reproduces the exact train/test split used in the training notebooks
(test_size=0.2, random_state=2) so the reported metrics reflect genuine
holdout performance of the already-trained model, not synthetic numbers.

Usage (called by server.ts via child_process):
  argv[1] → disease_type: "diabetes" | "heart" | "parkinsons"
  stdout  → JSON: ModelMetrics-shaped object
  stderr  → error messages if any
"""

import sys
import os
import json
import pickle
import warnings
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    confusion_matrix,
)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

MODEL_PATHS = {
    "diabetes":   os.path.join(MODEL_DIR, "diabetes_model.sav"),
    "heart":      os.path.join(MODEL_DIR, "heart_disease_model.sav"),
    "parkinsons": os.path.join(MODEL_DIR, "parkinsons_model.sav"),
}

DATASET_PATHS = {
    "diabetes":   os.path.join(DATASET_DIR, "diabetes.csv"),
    "heart":      os.path.join(DATASET_DIR, "heart.csv"),
    "parkinsons": os.path.join(DATASET_DIR, "parkinsons.csv"),
}

MODEL_NAMES = {
    "diabetes":   "SVC_Diabetes_v1.0",
    "heart":      "LogisticRegression_Heart_v1.0",
    "parkinsons": "SVC_Parkinsons_v1.0",
}

CONFUSION_LABELS = {
    "diabetes":   ["Non-Diabetic (0)", "Diabetic (1)"],
    "heart":      ["No Disease (0)", "Heart Disease (1)"],
    "parkinsons": ["Healthy (0)", "Parkinsons (1)"],
}


def load_split(disease_type: str):
    """Reproduce the exact X/Y split used in the training notebooks."""
    path = DATASET_PATHS[disease_type]
    df = pd.read_csv(path)

    if disease_type == "diabetes":
        X = df.drop(columns="Outcome")
        Y = df["Outcome"]
        X_train, X_test, Y_train, Y_test = train_test_split(
            X, Y, test_size=0.2, stratify=Y, random_state=2
        )
    elif disease_type == "heart":
        X = df.drop(columns="target")
        Y = df["target"]
        X_train, X_test, Y_train, Y_test = train_test_split(
            X, Y, test_size=0.2, stratify=Y, random_state=2
        )
    elif disease_type == "parkinsons":
        X = df.drop(columns=["name", "status"])
        Y = df["status"]
        X_train, X_test, Y_train, Y_test = train_test_split(
            X, Y, test_size=0.2, random_state=2
        )
    else:
        raise ValueError(f"Unknown disease_type: {disease_type}")

    return X, Y, X_train, X_test, Y_train, Y_test


def decision_scores(model, X):
    """Return a continuous score usable for ROC/PR curves."""
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    if hasattr(model, "decision_function"):
        raw = model.decision_function(X)
        return 1.0 / (1.0 + np.exp(-raw))
    return model.predict(X).astype(float)


def feature_importances(model, feature_names):
    """Extract normalized absolute feature importances from coef_ or feature_importances_."""
    if hasattr(model, "feature_importances_"):
        raw = np.abs(model.feature_importances_)
    elif hasattr(model, "coef_"):
        raw = np.abs(model.coef_[0])
    else:
        return {}
    total = raw.sum()
    if total <= 0:
        return {}
    normalized = raw / total
    pairs = sorted(zip(feature_names, normalized), key=lambda p: -p[1])
    return {name: round(float(val), 4) for name, val in pairs}


def downsample_curve(xs, ys, n_points=25):
    """Downsample a curve to n_points evenly spaced along xs for compact JSON payloads."""
    if len(xs) <= n_points:
        return list(zip(xs, ys))
    idx = np.linspace(0, len(xs) - 1, n_points).astype(int)
    return [(xs[i], ys[i]) for i in idx]


def evaluate(disease_type: str) -> dict:
    model_path = MODEL_PATHS[disease_type]
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    X, Y, X_train, X_test, Y_train, Y_test = load_split(disease_type)
    feature_names = list(X.columns)

    y_pred = model.predict(X_test)
    y_score = decision_scores(model, X_test)

    accuracy = accuracy_score(Y_test, y_pred)
    precision = precision_score(Y_test, y_pred, zero_division=0)
    recall = recall_score(Y_test, y_pred, zero_division=0)
    f1 = f1_score(Y_test, y_pred, zero_division=0)
    auc = roc_auc_score(Y_test, y_score)
    cm = confusion_matrix(Y_test, y_pred).tolist()

    fpr, tpr, _ = roc_curve(Y_test, y_score)
    prec_curve, rec_curve, _ = precision_recall_curve(Y_test, y_score)

    roc_points = downsample_curve(fpr.tolist(), tpr.tolist())
    pr_points = downsample_curve(rec_curve.tolist(), prec_curve.tolist())

    # 5-fold CV on the full dataset using a freshly cloned (unfitted) copy of the
    # same model architecture/hyperparameters, so CV reflects the real model type.
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=2)
    cv_scores = cross_val_score(clone(model), X, Y, cv=cv, scoring="roc_auc")

    trained_at = datetime.fromtimestamp(
        os.path.getmtime(model_path), tz=timezone.utc
    ).isoformat()

    return {
        "disease_type": disease_type,
        "model_name": MODEL_NAMES[disease_type],
        "model_version": "3.2.0",
        "trained_at": trained_at,
        "auc_roc": round(float(auc), 4),
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "cv_mean_auc": round(float(cv_scores.mean()), 4),
        "cv_std_auc": round(float(cv_scores.std()), 4),
        "feature_importances": feature_importances(model, feature_names),
        "confusion_matrix": {
            "matrix": cm,
            "labels": CONFUSION_LABELS[disease_type],
        },
        "roc_curve_data": [{"fpr": round(x, 3), "tpr": round(y, 3)} for x, y in roc_points],
        "precision_recall_data": [{"recall": round(x, 3), "precision": round(y, 3)} for x, y in pr_points],
        "n_test_samples": int(len(Y_test)),
        "n_train_samples": int(len(Y_train)),
        "source": "trained_sav_model_holdout_eval",
    }


def main():
    try:
        disease_type = sys.argv[1] if len(sys.argv) > 1 else "diabetes"
        result = evaluate(disease_type)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

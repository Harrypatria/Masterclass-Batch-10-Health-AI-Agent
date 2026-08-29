"""
AI Health Copilot Pro - Phase 4 & 6: Model Training, Evaluation & Serialisation
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + CRISP-DM
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, GridSearchCV

from backend.data_pipeline import FEATURE_NAMES, TARGET_NAME, load_and_audit_dataset
from backend.preprocessing import build_preprocessing_pipeline, prepare_train_test_data

NORMAL_RANGES = {
    "Glucose": (70, 99),
    "BloodPressure": (60, 80),
    "BMI": (18.5, 24.9),
    "Age": (0, 120)
}

def train_and_select_best_model():
    os.makedirs("saved_models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)

    df = load_and_audit_dataset()
    X_train, X_test, y_train, y_test = prepare_train_test_data(df, test_size=0.2, random_state=42)

    # Candidate Model A: Random Forest inside pipeline
    pipeline_rf = Pipeline([
        ("prep", build_preprocessing_pipeline()),
        ("classifier", RandomForestClassifier(n_estimators=200, max_depth=5, random_state=42, class_weight="balanced"))
    ])

    # Candidate Model B: Logistic Regression inside pipeline
    pipeline_lr = Pipeline([
        ("prep", build_preprocessing_pipeline()),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"))
    ])

    print("\n" + "=" * 60)
    print("PHASE 4: CANDIDATE MODEL EVALUATION")
    print("=" * 60)

    # 5-fold Stratified Cross Validation on full dataset
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    X_full = df[FEATURE_NAMES]
    y_full = df[TARGET_NAME]

    rf_cv_scores = cross_val_score(pipeline_rf, X_full, y_full, cv=cv, scoring="roc_auc")
    lr_cv_scores = cross_val_score(pipeline_lr, X_full, y_full, cv=cv, scoring="roc_auc")

    print(f"Model A (RandomForest)    5-Fold CV ROC-AUC: {rf_cv_scores.mean():.4f} +/- {rf_cv_scores.std():.4f}")
    print(f"Model B (LogisticReg)     5-Fold CV ROC-AUC: {lr_cv_scores.mean():.4f} +/- {lr_cv_scores.std():.4f}")

    # Train on training partition and test on holdout set
    pipeline_rf.fit(X_train, y_train)
    pipeline_lr.fit(X_train, y_train)

    y_pred_rf = pipeline_rf.predict(X_test)
    y_proba_rf = pipeline_rf.predict_proba(X_test)[:, 1]

    y_pred_lr = pipeline_lr.predict(X_test)
    y_proba_lr = pipeline_lr.predict_proba(X_test)[:, 1]

    auc_rf = roc_auc_score(y_test, y_proba_rf)
    acc_rf = accuracy_score(y_test, y_pred_rf)
    auc_lr = roc_auc_score(y_test, y_proba_lr)
    acc_lr = accuracy_score(y_test, y_pred_lr)

    print("\nHOLDOUT SET PERFORMANCE (80/20):")
    print(f"RandomForest:       AUC-ROC = {auc_rf:.4f} | Accuracy = {acc_rf:.4f}")
    print(f"LogisticRegression: AUC-ROC = {auc_lr:.4f} | Accuracy = {acc_lr:.4f}")

    best_pipeline = pipeline_rf
    best_name = "RandomForestClassifier_Pipeline"
    best_auc = auc_rf
    best_acc = acc_rf
    best_y_pred = y_pred_rf
    best_y_proba = y_proba_rf

    # Feature Importance from Random Forest
    rf_estimator = pipeline_rf.named_steps["classifier"]
    importances = dict(zip(FEATURE_NAMES, [float(round(v, 4)) for v in rf_estimator.feature_importances_]))

    cm = confusion_matrix(y_test, best_y_pred).tolist()
    cls_report = classification_report(y_test, best_y_pred, output_dict=True)

    metrics_payload = {
        "model_name": best_name,
        "model_version": "3.1.0",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "auc_roc": float(round(best_auc, 4)),
        "accuracy": float(round(best_acc, 4)),
        "precision": float(round(precision_score(y_test, best_y_pred), 4)),
        "recall": float(round(recall_score(y_test, best_y_pred), 4)),
        "f1_score": float(round(f1_score(y_test, best_y_pred), 4)),
        "cv_mean_auc": float(round(rf_cv_scores.mean(), 4)),
        "cv_std_auc": float(round(rf_cv_scores.std(), 4)),
        "feature_importances": importances,
        "confusion_matrix": {
            "matrix": cm,
            "labels": ["Non-Diabetic (0)", "Diabetic (1)"]
        },
        "classification_report": cls_report
    }

    # Save artifacts
    model_path = "saved_models/diabetes_model.sav"
    with open(model_path, "wb") as f:
        pickle.dump(best_pipeline, f)
    
    with open("saved_models/feature_names.json", "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    with open("saved_models/metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\nArtifacts successfully serialised to saved_models/:")
    print(f" - Model: {model_path}")
    print(f" - Feature Names: saved_models/feature_names.json")
    print(f" - Metrics: saved_models/metrics.json")

    return best_pipeline, metrics_payload

def flag_abnormal_features(patient_data: list, feature_names: list = FEATURE_NAMES) -> list:
    """
    Deterministic clinical flagging based on hard-coded normal ranges:
    Glucose: (70, 99) mg/dL
    BloodPressure: (60, 80) mmHg
    BMI: (18.5, 24.9) kg/m²
    Age: (0, 120)
    """
    flags = []
    feat_dict = dict(zip(feature_names, patient_data))

    glucose = feat_dict.get("Glucose", 0)
    if glucose > 99:
        flags.append(f"Elevated Fasting Glucose ({glucose:.1f} mg/dL, normal: 70-99)")
    elif 0 < glucose < 70:
        flags.append(f"Hypoglycemic Glucose ({glucose:.1f} mg/dL, normal: 70-99)")

    bp = feat_dict.get("BloodPressure", 0)
    if bp > 80:
        flags.append(f"Elevated Diastolic BP ({bp:.1f} mmHg, normal: 60-80)")
    elif 0 < bp < 60:
        flags.append(f"Low Diastolic BP ({bp:.1f} mmHg, normal: 60-80)")

    bmi = feat_dict.get("BMI", 0)
    if bmi >= 30.0:
        flags.append(f"Obese Range BMI ({bmi:.1f} kg/m², normal: 18.5-24.9)")
    elif bmi > 24.9:
        flags.append(f"Overweight BMI ({bmi:.1f} kg/m², normal: 18.5-24.9)")
    elif 0 < bmi < 18.5:
        flags.append(f"Underweight BMI ({bmi:.1f} kg/m², normal: 18.5-24.9)")

    dpf = feat_dict.get("DiabetesPedigreeFunction", 0)
    if dpf > 0.65:
        flags.append(f"High Genetic Pedigree Risk Score ({dpf:.3f})")

    age = feat_dict.get("Age", 0)
    if age >= 45:
        flags.append(f"Advanced Age Risk Factor ({int(age)} yrs)")

    return flags

if __name__ == "__main__":
    train_and_select_best_model()

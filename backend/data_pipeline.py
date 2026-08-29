"""
AI Health Copilot Pro - Phase 1: Data Ingestion & Audit
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + CRISP-DM
"""

import os
import pandas as pd
import numpy as np

# Exact feature order as specified in CRISP-DM specification
FEATURE_NAMES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
]

TARGET_NAME = "Outcome"

# Biologically impossible zero features to treat as missing
ZERO_IMPUTE_FEATURES = [
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI"
]

def load_and_audit_dataset(file_path: str = "dataset/diabetes.csv") -> pd.DataFrame:
    """
    Loads diabetes dataset and performs rigorous data audit:
    - Verifies shape and column completeness
    - Counts and replaces biological zeros with NaN
    - Validates class distribution
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset not found at {file_path}")

    df = pd.read_csv(file_path)
    print("=" * 60)
    print("PHASE 1: DATA INGESTION & AUDIT")
    print("=" * 60)
    print(f"Dataset shape: {df.shape} (Rows: {df.shape[0]}, Cols: {df.shape[1]})")
    print("\nFirst 5 rows:")
    print(df.head())
    
    print("\nOutcome class distribution:")
    value_counts = df[TARGET_NAME].value_counts()
    print(value_counts)
    print(f"Positive class ratio: {value_counts.get(1, 0) / len(df) * 100:.2f}%")

    print("\nExplicit count of biological zeros (missing values in disguise):")
    zero_counts = {}
    for col in ZERO_IMPUTE_FEATURES:
        count = (df[col] == 0).sum()
        zero_counts[col] = count
        pct = (count / len(df)) * 100
        print(f" - {col:15s}: {count:3d} zeros ({pct:5.1f}%)")

    # Replace zeros with NaN in specified clinical features
    df[ZERO_IMPUTE_FEATURES] = df[ZERO_IMPUTE_FEATURES].replace(0, np.nan)
    
    print("\nNull counts after zero -> np.nan transformation:")
    print(df.isna().sum())

    # Assert that Pregnancies, DiabetesPedigreeFunction, Age have no unexpected NaNs
    clean_cols = ["Pregnancies", "DiabetesPedigreeFunction", "Age", TARGET_NAME]
    for c in clean_cols:
        assert df[c].isna().sum() == 0, f"Unexpected NaN in column {c}"

    print("Data audit completed successfully.")
    return df

if __name__ == "__main__":
    load_and_audit_dataset()

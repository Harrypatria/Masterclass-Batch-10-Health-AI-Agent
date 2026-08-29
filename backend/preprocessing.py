"""
AI Health Copilot Pro - Phase 3: Clinical Preprocessing Pipeline
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + CRISP-DM
"""

import numpy as np
import pandas as pd
from typing import Tuple
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

from backend.data_pipeline import FEATURE_NAMES, TARGET_NAME, load_and_audit_dataset

def build_preprocessing_pipeline() -> Pipeline:
    """
    Constructs an sklearn Pipeline with:
    1. SimpleImputer(strategy='median') to handle missing/zero-replaced biological values
    2. StandardScaler() to standardize clinical features for numerical stability
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

def prepare_train_test_data(
    df: pd.DataFrame = None, 
    test_size: float = 0.2, 
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Performs stratified 80/20 train/test split maintaining exact feature order.
    """
    if df is None:
        df = load_and_audit_dataset()

    X = df[FEATURE_NAMES]
    y = df[TARGET_NAME]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        stratify=y,
        random_state=random_state
    )

    print(f"Training split: X_train={X_train.shape}, y_train={y_train.shape}")
    print(f"Test split:     X_test={X_test.shape}, y_test={y_test.shape}")
    return X_train, X_test, y_train, y_test

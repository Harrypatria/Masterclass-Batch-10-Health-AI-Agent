"""
AI Health Copilot Pro - Pydantic Schemas (Pydantic v2)
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class PatientFeatures(BaseModel):
    pregnancies: float = Field(..., ge=0, le=25, description="Number of times pregnant")
    glucose: float = Field(..., ge=0, le=350, description="Plasma glucose concentration (mg/dL)")
    blood_pressure: float = Field(..., ge=0, le=200, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: float = Field(..., ge=0, le=120, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(..., ge=0, le=1000, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(..., ge=0, le=90, description="Body mass index (weight in kg/(height in m)^2)")
    diabetes_pedigree: float = Field(..., ge=0, le=3.5, description="Diabetes pedigree function score")
    age: float = Field(..., ge=0, le=130, description="Age in years")

    def to_feature_list(self) -> List[float]:
        return [
            self.pregnancies,
            self.glucose,
            self.blood_pressure,
            self.skin_thickness,
            self.insulin,
            self.bmi,
            self.diabetes_pedigree,
            self.age
        ]

class AbnormalFlag(BaseModel):
    feature: str
    value: float
    normal_range: str
    status: Literal["LOW", "HIGH", "NORMAL", "ABNORMAL"]
    clinical_note: str

class ClinicalExplanation(BaseModel):
    risk_level: Literal["low", "moderate", "high"] = Field(
        ..., description="Clinical risk category based on ML probability and flags"
    )
    key_factors: List[str] = Field(
        ..., description="Deterministic abnormal features and risk drivers detected"
    )
    recommendation: str = Field(
        ..., description="Evidence-based next clinical steps, confirmatory lab testing, and lifestyle interventions"
    )
    disclaimer: str = Field(
        ..., description="Mandatory clinical decision support advisory and non-diagnostic legal statement"
    )

class PredictionResponse(BaseModel):
    prediction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    probability: float
    risk_level: Literal["low", "moderate", "high"]
    flags: List[str]
    abnormal_details: List[AbnormalFlag]
    key_factors: List[str]
    recommendation: str
    disclaimer: str
    model_version: str = "3.1.0"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    model_name: str = "RandomForestClassifier_Pipeline"

class BatchPredictRequest(BaseModel):
    patients: List[List[float]] = Field(..., max_length=200, description="List of 8-element patient feature vectors")
    patient_ids: Optional[List[str]] = None

class BatchPredictResponse(BaseModel):
    total_processed: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    predictions: List[PredictionResponse]

class AlertCreate(BaseModel):
    prediction_id: str
    patient_ref: str
    probability: float
    risk_level: str
    threshold: float = 0.70
    flags: List[str]

class AlertResponse(BaseModel):
    id: str
    prediction_id: str
    patient_ref: str
    probability: float
    risk_level: str
    threshold: float
    status: Literal["OPEN", "ACKNOWLEDGED", "RESOLVED"]
    assigned_to: Optional[str] = "Clinical Triage Team"
    created_at: str
    updated_at: str

class TaskCreate(BaseModel):
    alert_id: Optional[str] = None
    patient_ref: str
    title: str
    description: str
    intervention: str
    status: Literal["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] = "TODO"
    due_date: str
    assigned_to: str = "Care Coordinator"

class TaskResponse(BaseModel):
    id: str
    alert_id: Optional[str]
    patient_ref: str
    title: str
    description: str
    intervention: str
    status: Literal["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]
    due_date: str
    assigned_to: str
    created_at: str
    updated_at: str

class ModelMetricsResponse(BaseModel):
    auc_roc: float
    accuracy: float
    f1_score: float
    precision: float
    recall: float
    cv_mean_auc: float
    cv_std_auc: float
    model_version: str
    trained_at: str
    feature_importances: Dict[str, float]
    confusion_matrix: Dict[str, Any]

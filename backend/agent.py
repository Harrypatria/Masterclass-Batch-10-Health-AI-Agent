"""
AI Health Copilot Pro - Phase 7: Agentic Clinical Reasoning Layer
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: Chapter 10 Agentic ML Integration
"""

import os
import json
from typing import Dict, Any, List
from backend.schemas import ClinicalExplanation
from backend.train import flag_abnormal_features, FEATURE_NAMES

CLINICAL_DISCLAIMER_DEFAULT = (
    "AI Health Copilot Pro provides clinical decision support for screening and risk stratification only. "
    "It is NOT a diagnostic device. All risk estimates and recommendations must be reviewed and confirmed "
    "by a licensed healthcare professional alongside diagnostic lab testing (HbA1c, OGTT, lipid panel)."
)

def build_clinical_prompt(probability: float, flags: List[str]) -> str:
    """
    Builds the system-enforced prompt for the LLM.
    Strict Rule: Never send raw patient vectors to LLM. Only send probability + deterministic flags.
    """
    flags_formatted = "\n".join([f"- {flag}" for flag in flags]) if flags else "- None (all measured features within standard normal limits)"
    
    risk_level = "high" if probability >= 0.70 else "moderate" if probability >= 0.40 else "low"

    prompt = f"""
You are AI Health Copilot Pro, an evidence-based clinical decision support assistant adhering strictly to Chapter 10 Agentic ML patterns.

PATIENT RISK STRATIFICATION DATA:
- Calibrated ML Probability of Type-2 Diabetes: {probability * 100:.1f}% ({probability:.4f})
- Baseline Risk Category: {risk_level.upper()}
- Deterministically Detected Abnormal Feature Flags:
{flags_formatted}

CLINICAL COMMUNICATION GUIDELINES:
1. You are a clinical communication assistant for physicians/care teams, NOT a diagnosing medical provider.
2. Reason ONLY from the provided abnormal flags and calculated risk probability.
3. NEVER invent unmeasured clinical factors or extrapolate symptoms not provided.
4. Categorize risk_level strictly as "low", "moderate", or "high".
5. In key_factors: list 2 to 4 bullet points explaining the primary biological and physiological drivers based on the flags.
6. In recommendation: provide 2 to 3 actionable, evidence-based next steps (e.g., confirmatory laboratory orders such as HbA1c / 2h-OGTT, lifestyle/nutrition coaching, endocrinology referral, or routine follow-up).
7. In disclaimer: include the mandatory clinical decision support advisory statement.

Return valid JSON adhering strictly to the schema:
{{
  "risk_level": "low" | "moderate" | "high",
  "key_factors": ["factor 1", "factor 2"],
  "recommendation": "detailed next clinical steps...",
  "disclaimer": "{CLINICAL_DISCLAIMER_DEFAULT}"
}}
"""
    return prompt.strip()

def explain_diagnosis_deterministic(probability: float, flags: List[str]) -> ClinicalExplanation:
    """
    High-reliability deterministic clinical fallback engine if LLM API is offline or unconfigured.
    """
    risk_level = "high" if probability >= 0.70 else "moderate" if probability >= 0.40 else "low"
    
    key_factors = []
    if flags:
        for f in flags[:4]:
            key_factors.append(f)
    else:
        key_factors.append(f"Standard metabolic parameters observed; estimated baseline risk at {probability*100:.1f}%.")

    if risk_level == "high":
        rec = (
            "Immediate Tier-1 Action: Order confirmatory laboratory diagnostics including Fasting Plasma Glucose (FPG) "
            "and Glycated Hemoglobin (HbA1c). Initiate urgent primary care consultation, diabetes self-management education "
            "(DSMES), and medical nutrition therapy."
        )
    elif risk_level == "moderate":
        rec = (
            "Tier-2 Monitoring: Schedule follow-up glycemic screening within 3-6 months. Recommend lifestyle intervention "
            "program targeting 5-7% weight reduction and at least 150 minutes of moderate aerobic physical activity weekly."
        )
    else:
        rec = (
            "Routine Maintenance: Maintain annual preventative wellness checkups and routine metabolic panel. "
            "Encourage ongoing balanced nutrition and regular physical activity."
        )

    return ClinicalExplanation(
        risk_level=risk_level,
        key_factors=key_factors,
        recommendation=rec,
        disclaimer=CLINICAL_DISCLAIMER_DEFAULT
    )

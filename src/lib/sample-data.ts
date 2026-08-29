/**
 * AI Health Copilot Pro - Pre-configured Clinical Sample Cohorts and ITDO Store
 */

import { PatientDiabetesFeatures, Alert, ClinicalTask, PredictionResult } from '../types';

export interface PreloadedPatientCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  caseDescription: string;
  category: 'High Risk Alert' | 'Moderate Risk' | 'Low Risk Control' | 'Borderline';
  features: PatientDiabetesFeatures;
}

export const SAMPLE_PATIENT_CASES: PreloadedPatientCase[] = [
  {
    id: 'PT-8842',
    name: 'Eleanor Vance',
    age: 50,
    gender: 'Female',
    category: 'High Risk Alert',
    caseDescription: '50yo female presenting with elevated fasting glucose (148 mg/dL), BMI 33.6, family history of Type-2 diabetes.',
    features: {
      pregnancies: 6,
      glucose: 148,
      bloodPressure: 72,
      skinThickness: 35,
      insulin: 168,
      bmi: 33.6,
      diabetesPedigree: 0.627,
      age: 50
    }
  },
  {
    id: 'PT-3109',
    name: 'Marcus Chen',
    age: 31,
    gender: 'Male',
    category: 'Low Risk Control',
    caseDescription: '31yo active male, normal glucose (85 mg/dL), healthy BMI 26.6, no direct familial diabetes history.',
    features: {
      pregnancies: 0,
      glucose: 85,
      bloodPressure: 66,
      skinThickness: 29,
      insulin: 68,
      bmi: 26.6,
      diabetesPedigree: 0.351,
      age: 31
    }
  },
  {
    id: 'PT-9421',
    name: 'Gloria Ramirez',
    age: 54,
    gender: 'Female',
    category: 'High Risk Alert',
    caseDescription: '54yo female with severe metabolic syndrome markers: glucose 197 mg/dL, insulin 543 µIU/mL, elevated pedigree score.',
    features: {
      pregnancies: 2,
      glucose: 197,
      bloodPressure: 70,
      skinThickness: 45,
      insulin: 543,
      bmi: 30.5,
      diabetesPedigree: 0.158,
      age: 54
    }
  },
  {
    id: 'PT-6023',
    name: 'Sophia Patel',
    age: 30,
    gender: 'Female',
    category: 'Moderate Risk',
    caseDescription: '30yo female with border glucose (116 mg/dL) and elevated BMI (25.6), history of gestational diabetes.',
    features: {
      pregnancies: 5,
      glucose: 116,
      bloodPressure: 74,
      skinThickness: 22,
      insulin: 90,
      bmi: 25.6,
      diabetesPedigree: 0.201,
      age: 30
    }
  },
  {
    id: 'PT-7714',
    name: 'David Miller',
    age: 59,
    gender: 'Male',
    category: 'High Risk Alert',
    caseDescription: '59yo male with acute hyperinsulinemia (846 µIU/mL), fasting glucose 189 mg/dL, BMI 30.1.',
    features: {
      pregnancies: 0,
      glucose: 189,
      bloodPressure: 60,
      skinThickness: 23,
      insulin: 846,
      bmi: 30.1,
      diabetesPedigree: 0.398,
      age: 59
    }
  },
  {
    id: 'PT-1240',
    name: 'Hannah Brooks',
    age: 22,
    gender: 'Female',
    category: 'Low Risk Control',
    caseDescription: '22yo female college athlete, fasting glucose 97 mg/dL, normal BMI 23.2, no clinical abnormalities.',
    features: {
      pregnancies: 1,
      glucose: 97,
      bloodPressure: 66,
      skinThickness: 15,
      insulin: 140,
      bmi: 23.2,
      diabetesPedigree: 0.487,
      age: 22
    }
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1001',
    prediction_id: 'PRED-8842',
    patient_ref: 'PT-8842',
    patient_name: 'Eleanor Vance',
    disease_type: 'diabetes',
    probability: 0.8640,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (148.0 mg/dL, normal: 70-99)',
      'Obese Range BMI (33.6 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (50 yrs)'
    ],
    status: 'OPEN',
    severity: 'HIGH',
    assigned_to: 'Dr. Sarah Jenkins, MD',
    notes: 'Triggered automatically via ITDO threshold engine (>0.70). Immediate HbA1c required.',
    created_at: '2026-08-28T18:24:00Z',
    updated_at: '2026-08-28T18:24:00Z'
  },
  {
    id: 'ALT-1002',
    prediction_id: 'PRED-9421',
    patient_ref: 'PT-9421',
    patient_name: 'Gloria Ramirez',
    disease_type: 'diabetes',
    probability: 0.9410,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (197.0 mg/dL, normal: 70-99)',
      'Hyperinsulinemia Indicator (543 µIU/mL)',
      'Obese Range BMI (30.5 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (54 yrs)'
    ],
    status: 'ACKNOWLEDGED',
    severity: 'CRITICAL',
    assigned_to: 'Endocrinology Triage Unit',
    notes: 'Patient contacted. Clinic appointment scheduled for tomorrow morning.',
    created_at: '2026-08-28T14:12:00Z',
    updated_at: '2026-08-28T16:05:00Z'
  },
  {
    id: 'ALT-1003',
    prediction_id: 'PRED-7714',
    patient_ref: 'PT-7714',
    patient_name: 'David Miller',
    disease_type: 'diabetes',
    probability: 0.9120,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (189.0 mg/dL, normal: 70-99)',
      'Hyperinsulinemia Indicator (846 µIU/mL)',
      'Obese Range BMI (30.1 kg/m², normal: 18.5-24.9)'
    ],
    status: 'OPEN',
    severity: 'HIGH',
    assigned_to: 'Nurse Practitioner Robert Lee',
    notes: 'Lab order generated. Fasting blood draw pending.',
    created_at: '2026-08-28T09:40:00Z',
    updated_at: '2026-08-28T09:40:00Z'
  }
];

export const INITIAL_TASKS: ClinicalTask[] = [
  {
    id: 'TSK-2001',
    alert_id: 'ALT-1001',
    patient_ref: 'PT-8842',
    patient_name: 'Eleanor Vance',
    disease_type: 'diabetes',
    title: 'Order Confirmatory Glycated Hemoglobin (HbA1c) & Fasting Lipid Panel',
    description: 'Patient flagged with 86.4% diabetes probability and glucose 148 mg/dL. Requisition sent to Quest Diagnostics.',
    intervention: 'Laboratory Diagnostic Requisition',
    status: 'TODO',
    priority: 'URGENT',
    due_date: '2026-09-01',
    assigned_to: 'Clinical Triage Coordinator',
    created_at: '2026-08-28T18:30:00Z',
    updated_at: '2026-08-28T18:30:00Z'
  },
  {
    id: 'TSK-2002',
    alert_id: 'ALT-1002',
    patient_ref: 'PT-9421',
    patient_name: 'Gloria Ramirez',
    disease_type: 'diabetes',
    title: 'Urgent Referral to Endocrinology & Diabetes Educator (DSMES)',
    description: 'Severe fasting hyperglycemia (197 mg/dL) and insulin resistance. Conduct comprehensive metabolic assessment.',
    intervention: 'Specialist Referral & Patient Education',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    due_date: '2026-08-30',
    assigned_to: 'Endocrinology Care Team',
    created_at: '2026-08-28T16:10:00Z',
    updated_at: '2026-08-28T17:20:00Z'
  },
  {
    id: 'TSK-2003',
    alert_id: 'ALT-1003',
    patient_ref: 'PT-7714',
    patient_name: 'David Miller',
    disease_type: 'diabetes',
    title: 'Initiate Medical Nutrition Therapy (MNT) & Continuous Glucose Monitoring Setup',
    description: 'Target dietary carbohydrate reduction (<45g/meal) and evaluate for 14-day CGM sensor placement.',
    intervention: 'Medical Nutrition Therapy & Device Enrollment',
    status: 'TODO',
    priority: 'HIGH',
    due_date: '2026-09-04',
    assigned_to: 'Registered Dietitian (RD)',
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:00:00Z'
  },
  {
    id: 'TSK-2004',
    patient_ref: 'PT-6023',
    patient_name: 'Sophia Patel',
    disease_type: 'diabetes',
    title: 'Schedule 3-Month Pre-Diabetes Glycemic Screening Follow-up',
    description: 'Moderate risk patient (glucose 116 mg/dL). Enroll in community lifestyle coaching program.',
    intervention: 'Preventative Care Tracking',
    status: 'DONE',
    priority: 'MEDIUM',
    due_date: '2026-08-25',
    assigned_to: 'Care Navigator',
    created_at: '2026-08-25T11:00:00Z',
    updated_at: '2026-08-26T14:30:00Z'
  }
];

export const INITIAL_PREDICTIONS: PredictionResult[] = [
  {
    prediction_id: 'PRED-8842',
    disease_type: 'diabetes',
    patient_ref: 'PT-8842',
    patient_name: 'Eleanor Vance',
    probability: 0.8640,
    risk_level: 'high',
    flags: [
      'Elevated Fasting Glucose (148.0 mg/dL, normal: 70-99)',
      'Obese Range BMI (33.6 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (50 yrs)'
    ],
    abnormal_details: [],
    key_factors: [
      'Elevated Fasting Glucose (148.0 mg/dL, normal: 70-99)',
      'Obese Range BMI (33.6 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (50 yrs)'
    ],
    recommendation: 'Tier-1 Urgent Diagnostic Protocol: Order confirmatory laboratory diagnostics including Fasting Plasma Glucose (FPG) and Glycated Hemoglobin (HbA1c). Initiate urgent primary care consultation.',
    disclaimer: 'AI Health Copilot Pro provides clinical decision support for screening and risk stratification only. It is NOT a diagnostic device.',
    model_version: '3.1.0',
    model_name: 'RandomForestClassifier_Pipeline_v3.1',
    created_at: '2026-08-28T18:24:00Z',
    raw_features: {
      pregnancies: 6,
      glucose: 148,
      bloodPressure: 72,
      skinThickness: 35,
      insulin: 168,
      bmi: 33.6,
      diabetesPedigree: 0.627,
      age: 50
    }
  },
  {
    prediction_id: 'PRED-3109',
    disease_type: 'diabetes',
    patient_ref: 'PT-3109',
    patient_name: 'Marcus Chen',
    probability: 0.0820,
    risk_level: 'low',
    flags: [],
    abnormal_details: [],
    key_factors: [
      'All measured clinical parameters are within baseline reference limits.',
      'Calculated risk probability of 8.2% aligns with standard low-risk population.'
    ],
    recommendation: 'Tier-3 Routine Prevention: Maintain annual preventative wellness checkups and routine metabolic panel. Encourage ongoing balanced nutrition.',
    disclaimer: 'AI Health Copilot Pro provides clinical decision support for screening and risk stratification only. It is NOT a diagnostic device.',
    model_version: '3.1.0',
    model_name: 'RandomForestClassifier_Pipeline_v3.1',
    created_at: '2026-08-28T17:15:00Z',
    raw_features: {
      pregnancies: 0,
      glucose: 85,
      bloodPressure: 66,
      skinThickness: 29,
      insulin: 68,
      bmi: 26.6,
      diabetesPedigree: 0.351,
      age: 31
    }
  }
];

/**
 * AI Health Copilot Pro - Core TypeScript Types
 * Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
 * Version: 3.1.0 | Framework: ITDO Framework (Insights -> Triggers -> Decisions -> Operations)
 */

export type DiseaseType = 'diabetes' | 'heart' | 'parkinsons';

export interface PatientDiabetesFeatures {
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigree: number;
  age: number;
}

export interface PatientHeartFeatures {
  age: number;
  sex: number; // 1 = male, 0 = female
  cp: number; // chest pain type 0-3
  trestbps: number; // resting blood pressure
  chol: number; // serum cholesterol
  fbs: number; // fasting blood sugar > 120
  restecg: number; // resting electrocardiographic results
  thalach: number; // maximum heart rate achieved
  exang: number; // exercise induced angina
  oldpeak: number; // ST depression
  slope: number; // slope of peak exercise ST segment
  ca: number; // number of major vessels (0-3)
  thal: number; // thalassemia
}

export interface PatientParkinsonsFeatures {
  fo: number; // MDVP:Fo(Hz) Average vocal fundamental frequency
  fhi: number; // MDVP:Fhi(Hz) Maximum vocal fundamental frequency
  flo: number; // MDVP:Flo(Hz) Minimum vocal fundamental frequency
  jitterPct: number; // MDVP:Jitter(%)
  jitterAbs: number; // MDVP:Jitter(Abs)
  rap: number; // MDVP:RAP
  ppq: number; // MDVP:PPQ
  ddp: number; // Jitter:DDP
  shimmer: number; // MDVP:Shimmer
  shimmerDb: number; // MDVP:Shimmer(dB)
  apq3: number; // Shimmer:APQ3
  apq5: number; // Shimmer:APQ5
  apq: number; // MDVP:APQ
  dda: number; // Shimmer:DDA
  nhr: number; // NHR Noise-to-harmonics ratio
  hnr: number; // HNR Harmonics-to-noise ratio
  rpde: number; // RPDE recurrence period density entropy
  dfa: number; // DFA signal fractal scaling exponent
  spread1: number; // spread1
  spread2: number; // spread2
  d2: number; // D2 correlation dimension
  ppe: number; // PPE pitch period entropy
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface AbnormalFlagDetail {
  feature: string;
  label: string;
  value: number;
  unit: string;
  normalRange: string;
  status: 'LOW' | 'HIGH' | 'NORMAL' | 'ABNORMAL';
  severity: 'normal' | 'warning' | 'danger';
  clinicalNote: string;
}

export interface ClinicalExplanation {
  risk_level: RiskLevel;
  key_factors: string[];
  recommendation: string;
  disclaimer: string;
}

export interface PredictionResult {
  prediction_id: string;
  disease_type: DiseaseType;
  patient_ref: string;
  patient_name?: string;
  probability: number;
  risk_level: RiskLevel;
  flags: string[];
  abnormal_details: AbnormalFlagDetail[];
  key_factors: string[];
  recommendation: string;
  disclaimer: string;
  model_version: string;
  model_name: string;
  created_at: string;
  raw_features: Record<string, number>;
}

export interface Alert {
  id: string;
  prediction_id: string;
  patient_ref: string;
  patient_name?: string;
  disease_type: DiseaseType;
  probability: number;
  risk_level: RiskLevel;
  threshold: number;
  flags: string[];
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ClinicalTask {
  id: string;
  alert_id?: string;
  patient_ref: string;
  patient_name?: string;
  disease_type: DiseaseType;
  title: string;
  description: string;
  intervention: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface ModelMetrics {
  disease_type: DiseaseType;
  model_name: string;
  model_version: string;
  trained_at: string;
  auc_roc: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_mean_auc: number;
  cv_std_auc: number;
  feature_importances: Record<string, number>;
  confusion_matrix: {
    matrix: number[][];
    labels: string[];
  };
  roc_curve_data: Array<{ fpr: number; tpr: number }>;
  precision_recall_data: Array<{ recall: number; precision: number }>;
}

export interface AppSettings {
  alertThreshold: number; // e.g. 0.70
  moderateThreshold: number; // e.g. 0.40
  defaultModel: 'random_forest' | 'logistic_regression';
  useAiReasoning: boolean;
  customDisclaimer: string;
  autoCreateTasksForHighRisk: boolean;
  theme: 'dark' | 'light' | 'clinical-dark';
}

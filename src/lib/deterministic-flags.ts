/**
 * AI Health Copilot Pro - Deterministic Feature Flagging Engine
 * Hardcoded clinical reference ranges for clinical safety and triage.
 */

import { AbnormalFlagDetail, PatientDiabetesFeatures, PatientHeartFeatures, PatientParkinsonsFeatures } from '../types';

export const DIABETES_NORMAL_RANGES = {
  glucose: { min: 70, max: 99, unit: 'mg/dL', label: 'Fasting Plasma Glucose' },
  bloodPressure: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic Blood Pressure' },
  bmi: { min: 18.5, max: 24.9, unit: 'kg/m²', label: 'Body Mass Index' },
  age: { min: 0, max: 120, thresholdWarning: 45, unit: 'years', label: 'Patient Age' },
  insulin: { min: 16, max: 166, unit: 'µIU/mL', label: '2-Hour Serum Insulin' },
  skinThickness: { min: 10, max: 50, unit: 'mm', label: 'Triceps Skinfold' },
  diabetesPedigree: { min: 0.08, max: 0.65, unit: 'score', label: 'Pedigree Genetic Function' },
  pregnancies: { min: 0, max: 20, thresholdWarning: 5, unit: 'count', label: 'Pregnancies' },
};

export function flagDiabetesFeatures(f: PatientDiabetesFeatures): { flags: string[]; details: AbnormalFlagDetail[] } {
  const flags: string[] = [];
  const details: AbnormalFlagDetail[] = [];

  // Glucose Flagging
  if (f.glucose > 99) {
    const isSevere = f.glucose >= 126;
    flags.push(`Elevated Fasting Glucose (${f.glucose.toFixed(1)} mg/dL, normal: 70-99)`);
    details.push({
      feature: 'glucose',
      label: 'Fasting Plasma Glucose',
      value: f.glucose,
      unit: 'mg/dL',
      normalRange: '70 - 99 mg/dL',
      status: 'HIGH',
      severity: isSevere ? 'danger' : 'warning',
      clinicalNote: isSevere ? 'Diabetic threshold (≥126 mg/dL) reached.' : 'Impaired fasting glucose (Pre-diabetic range 100-125 mg/dL).'
    });
  } else if (f.glucose > 0 && f.glucose < 70) {
    flags.push(`Hypoglycemic Glucose (${f.glucose.toFixed(1)} mg/dL, normal: 70-99)`);
    details.push({
      feature: 'glucose',
      label: 'Fasting Plasma Glucose',
      value: f.glucose,
      unit: 'mg/dL',
      normalRange: '70 - 99 mg/dL',
      status: 'LOW',
      severity: 'warning',
      clinicalNote: 'Hypoglycemic reading requiring clinical investigation.'
    });
  } else {
    details.push({
      feature: 'glucose',
      label: 'Fasting Plasma Glucose',
      value: f.glucose,
      unit: 'mg/dL',
      normalRange: '70 - 99 mg/dL',
      status: 'NORMAL',
      severity: 'normal',
      clinicalNote: 'Normoglycemic fasting range.'
    });
  }

  // Blood Pressure Flagging
  if (f.bloodPressure > 80) {
    const isStage2 = f.bloodPressure >= 90;
    flags.push(`Elevated Diastolic BP (${f.bloodPressure.toFixed(1)} mmHg, normal: 60-80)`);
    details.push({
      feature: 'bloodPressure',
      label: 'Diastolic Blood Pressure',
      value: f.bloodPressure,
      unit: 'mmHg',
      normalRange: '60 - 80 mmHg',
      status: 'HIGH',
      severity: isStage2 ? 'danger' : 'warning',
      clinicalNote: isStage2 ? 'Stage 2 hypertension diastolic threshold.' : 'Stage 1 diastolic hypertension.'
    });
  } else if (f.bloodPressure > 0 && f.bloodPressure < 60) {
    flags.push(`Low Diastolic BP (${f.bloodPressure.toFixed(1)} mmHg, normal: 60-80)`);
    details.push({
      feature: 'bloodPressure',
      label: 'Diastolic Blood Pressure',
      value: f.bloodPressure,
      unit: 'mmHg',
      normalRange: '60 - 80 mmHg',
      status: 'LOW',
      severity: 'warning',
      clinicalNote: 'Hypotensive diastolic range.'
    });
  } else {
    details.push({
      feature: 'bloodPressure',
      label: 'Diastolic Blood Pressure',
      value: f.bloodPressure,
      unit: 'mmHg',
      normalRange: '60 - 80 mmHg',
      status: 'NORMAL',
      severity: 'normal',
      clinicalNote: 'Normal resting blood pressure.'
    });
  }

  // BMI Flagging
  if (f.bmi >= 30.0) {
    flags.push(`Obese Range BMI (${f.bmi.toFixed(1)} kg/m², normal: 18.5-24.9)`);
    details.push({
      feature: 'bmi',
      label: 'Body Mass Index',
      value: f.bmi,
      unit: 'kg/m²',
      normalRange: '18.5 - 24.9 kg/m²',
      status: 'HIGH',
      severity: 'danger',
      clinicalNote: f.bmi >= 35 ? 'Class II/III Severe Obesity.' : 'Class I Obesity (independent insulin resistance multiplier).'
    });
  } else if (f.bmi > 24.9) {
    flags.push(`Overweight BMI (${f.bmi.toFixed(1)} kg/m², normal: 18.5-24.9)`);
    details.push({
      feature: 'bmi',
      label: 'Body Mass Index',
      value: f.bmi,
      unit: 'kg/m²',
      normalRange: '18.5 - 24.9 kg/m²',
      status: 'HIGH',
      severity: 'warning',
      clinicalNote: 'Overweight range associated with elevated metabolic strain.'
    });
  } else if (f.bmi > 0 && f.bmi < 18.5) {
    flags.push(`Underweight BMI (${f.bmi.toFixed(1)} kg/m², normal: 18.5-24.9)`);
    details.push({
      feature: 'bmi',
      label: 'Body Mass Index',
      value: f.bmi,
      unit: 'kg/m²',
      normalRange: '18.5 - 24.9 kg/m²',
      status: 'LOW',
      severity: 'warning',
      clinicalNote: 'Underweight metric.'
    });
  } else {
    details.push({
      feature: 'bmi',
      label: 'Body Mass Index',
      value: f.bmi,
      unit: 'kg/m²',
      normalRange: '18.5 - 24.9 kg/m²',
      status: 'NORMAL',
      severity: 'normal',
      clinicalNote: 'Healthy normal body mass index.'
    });
  }

  // Pedigree Genetic Function
  if (f.diabetesPedigree > 0.65) {
    flags.push(`Elevated Genetic Pedigree Score (${f.diabetesPedigree.toFixed(3)})`);
    details.push({
      feature: 'diabetesPedigree',
      label: 'Diabetes Pedigree Function',
      value: f.diabetesPedigree,
      unit: 'score',
      normalRange: '0.08 - 0.65',
      status: 'HIGH',
      severity: 'warning',
      clinicalNote: 'Significant familial history and genetic predisposition.'
    });
  }

  // Age Factor
  if (f.age >= 45) {
    flags.push(`Advanced Age Risk Factor (${Math.round(f.age)} yrs)`);
    details.push({
      feature: 'age',
      label: 'Patient Age',
      value: f.age,
      unit: 'years',
      normalRange: '< 45 years',
      status: 'HIGH',
      severity: f.age >= 60 ? 'danger' : 'warning',
      clinicalNote: 'ADA guidelines recommend routine annual screening for age ≥ 45.'
    });
  }

  // Insulin Flagging
  if (f.insulin > 166) {
    flags.push(`Hyperinsulinemia Indicator (${f.insulin.toFixed(0)} µIU/mL)`);
    details.push({
      feature: 'insulin',
      label: '2-Hour Serum Insulin',
      value: f.insulin,
      unit: 'µIU/mL',
      normalRange: '16 - 166 µIU/mL',
      status: 'HIGH',
      severity: 'warning',
      clinicalNote: 'Elevated circulating insulin indicates compensatory beta-cell response to insulin resistance.'
    });
  }

  return { flags, details };
}

export function flagHeartFeatures(f: PatientHeartFeatures): { flags: string[]; details: AbnormalFlagDetail[] } {
  const flags: string[] = [];
  const details: AbnormalFlagDetail[] = [];

  if (f.trestbps > 130) {
    flags.push(`Hypertensive Resting BP (${f.trestbps} mmHg)`);
  }
  if (f.chol > 200) {
    flags.push(`High Serum Cholesterol (${f.chol} mg/dL, normal < 200)`);
  }
  if (f.exang === 1) {
    flags.push(`Exercise-Induced Angina Positive`);
  }
  if (f.oldpeak > 1.5) {
    flags.push(`Significant ST Depression (${f.oldpeak.toFixed(1)} mm)`);
  }
  if (f.thalach < 100) {
    flags.push(`Low Maximum Heart Rate (${f.thalach} bpm)`);
  }

  return { flags, details };
}

export function flagParkinsonsFeatures(f: PatientParkinsonsFeatures): { flags: string[]; details: AbnormalFlagDetail[] } {
  const flags: string[] = [];
  const details: AbnormalFlagDetail[] = [];

  if (f.jitterPct > 0.006) {
    flags.push(`Elevated Vocal Jitter (${(f.jitterPct * 100).toFixed(3)}%)`);
  }
  if (f.shimmer > 0.035) {
    flags.push(`Elevated Vocal Shimmer Amplitude (${f.shimmer.toFixed(4)})`);
  }
  if (f.hnr < 20) {
    flags.push(`Low Harmonics-to-Noise Ratio (${f.hnr.toFixed(1)} dB, normal > 20)`);
  }
  if (f.ppe > 0.25) {
    flags.push(`Elevated Pitch Period Entropy (${f.ppe.toFixed(3)})`);
  }

  return { flags, details };
}

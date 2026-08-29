import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Info, 
  ChevronRight,
  TrendingUp,
  FileCheck,
  Stethoscope,
  Send,
  Zap
} from 'lucide-react';
import { 
  DiseaseType, 
  PatientDiabetesFeatures, 
  PatientHeartFeatures,
  PatientParkinsonsFeatures,
  PredictionResult, 
  AppSettings,
  Alert,
  ClinicalTask
} from '../types';
import { 
  predictDiabetesProbability, 
  predictHeartProbability, 
  predictParkinsonsProbability,
  generateDeterministicClinicalExplanation 
} from '../lib/ml-engine';
import { flagDiabetesFeatures, flagHeartFeatures, flagParkinsonsFeatures } from '../lib/deterministic-flags';
import { SAMPLE_PATIENT_CASES, PreloadedPatientCase } from '../lib/sample-data';

interface ScreeningViewProps {
  selectedDisease: DiseaseType;
  settings: AppSettings;
  onAddAlert: (alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => void;
  onAddTask: (task: Omit<ClinicalTask, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  selectedDisease,
  settings,
  onAddAlert,
  onAddTask
}) => {
  // Diabetes State
  const [diabetesFeatures, setDiabetesFeatures] = useState<PatientDiabetesFeatures>({
    pregnancies: 6,
    glucose: 148,
    bloodPressure: 72,
    skinThickness: 35,
    insulin: 168,
    bmi: 33.6,
    diabetesPedigree: 0.627,
    age: 50
  });

  // Heart Features State
  const [heartFeatures, setHeartFeatures] = useState<PatientHeartFeatures>({
    age: 58,
    sex: 1,
    cp: 2,
    trestbps: 140,
    chol: 245,
    fbs: 1,
    restecg: 0,
    thalach: 135,
    exang: 1,
    oldpeak: 2.1,
    slope: 1,
    ca: 1,
    thal: 2
  });

  // Parkinsons Features State
  const [parkinsonsFeatures, setParkinsonsFeatures] = useState<PatientParkinsonsFeatures>({
    fo: 119.992,
    fhi: 157.302,
    flo: 74.997,
    jitterPct: 0.00784,
    jitterAbs: 0.00007,
    rap: 0.0037,
    ppq: 0.00554,
    ddp: 0.01109,
    shimmer: 0.04374,
    shimmerDb: 0.426,
    apq3: 0.02182,
    apq5: 0.0313,
    apq: 0.02971,
    dda: 0.06545,
    nhr: 0.02211,
    hnr: 21.033,
    rpde: 0.414783,
    dfa: 0.815285,
    spread1: -4.813031,
    spread2: 0.266482,
    d2: 2.301442,
    ppe: 0.284654
  });

  const [patientRef, setPatientRef] = useState<string>('PT-8842');
  const [patientName, setPatientName] = useState<string>('Eleanor Vance');
  const [selectedCohort, setSelectedCohort] = useState<string>('PT-8842');
  
  // Results & AI State
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanationSource, setExplanationSource] = useState<string>('deterministic');
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);
  const [taskCreated, setTaskCreated] = useState<boolean>(false);

  // Compute prediction and deterministic flags whenever inputs change
  useEffect(() => {
    let proba = 0;
    let risk_level: 'low' | 'moderate' | 'high' = 'low';
    let flags: string[] = [];
    let abnormal_details: any[] = [];
    let model_name = '';

    if (selectedDisease === 'diabetes') {
      const res = predictDiabetesProbability(diabetesFeatures);
      const flagRes = flagDiabetesFeatures(diabetesFeatures);
      proba = res.probability;
      risk_level = res.risk_level;
      flags = flagRes.flags;
      abnormal_details = flagRes.details;
      model_name = res.model_name;
    } else if (selectedDisease === 'heart') {
      const res = predictHeartProbability(heartFeatures);
      const flagRes = flagHeartFeatures(heartFeatures);
      proba = res.probability;
      risk_level = res.risk_level;
      flags = flagRes.flags;
      abnormal_details = flagRes.details;
      model_name = res.model_name;
    } else {
      const res = predictParkinsonsProbability(parkinsonsFeatures);
      const flagRes = flagParkinsonsFeatures(parkinsonsFeatures);
      proba = res.probability;
      risk_level = res.risk_level;
      flags = flagRes.flags;
      abnormal_details = flagRes.details;
      model_name = res.model_name;
    }

    const defaultExpl = generateDeterministicClinicalExplanation(
      proba,
      flags,
      selectedDisease,
      settings.customDisclaimer
    );

    setCurrentPrediction({
      prediction_id: 'PRED-' + Math.floor(1000 + Math.random() * 9000),
      disease_type: selectedDisease,
      patient_ref: patientRef,
      patient_name: patientName,
      probability: proba,
      risk_level,
      flags,
      abnormal_details,
      key_factors: defaultExpl.key_factors,
      recommendation: defaultExpl.recommendation,
      disclaimer: defaultExpl.disclaimer,
      model_version: '3.1.0',
      model_name,
      created_at: new Date().toISOString(),
      raw_features: diabetesFeatures as any
    });

    setAlertTriggered(false);
    setTaskCreated(false);
    setExplanationSource('deterministic');
  }, [diabetesFeatures, heartFeatures, parkinsonsFeatures, selectedDisease, patientRef, patientName, settings.customDisclaimer]);

  // Load sample patient
  const handleLoadSample = (sample: PreloadedPatientCase) => {
    setSelectedCohort(sample.id);
    setPatientRef(sample.id);
    setPatientName(sample.name);
    setDiabetesFeatures(sample.features);
  };

  // Run Agentic Gemini Reasoning
  const handleRunAgentReasoning = async () => {
    if (!currentPrediction) return;
    setIsExplaining(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          probability: currentPrediction.probability,
          flags: currentPrediction.flags,
          patient_ref: currentPrediction.patient_ref,
          disease_type: selectedDisease
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPrediction((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            risk_level: data.risk_level || prev.risk_level,
            key_factors: data.key_factors || prev.key_factors,
            recommendation: data.recommendation || prev.recommendation,
            disclaimer: data.disclaimer || prev.disclaimer
          };
        });
        setExplanationSource(data.source || 'gemini-agent');
      }
    } catch (err) {
      console.error('Agent explanation request failed:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Trigger ITDO Alert
  const handleTriggerAlert = () => {
    if (!currentPrediction) return;
    onAddAlert({
      prediction_id: currentPrediction.prediction_id,
      patient_ref: currentPrediction.patient_ref,
      patient_name: currentPrediction.patient_name,
      disease_type: selectedDisease,
      probability: currentPrediction.probability,
      risk_level: currentPrediction.risk_level,
      threshold: settings.alertThreshold,
      flags: currentPrediction.flags,
      status: 'OPEN',
      severity: currentPrediction.probability >= 0.85 ? 'CRITICAL' : 'HIGH',
      assigned_to: 'Clinical Triage Team',
      notes: `Triggered via AI Health Copilot Pro single screening. ${currentPrediction.flags.length} abnormal flags detected.`
    });
    setAlertTriggered(true);
  };

  // Create Care Task
  const handleCreateCareTask = () => {
    if (!currentPrediction) return;
    const dueDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    onAddTask({
      alert_id: alertTriggered ? 'ALT-LINKED' : undefined,
      patient_ref: currentPrediction.patient_ref,
      patient_name: currentPrediction.patient_name,
      disease_type: selectedDisease,
      title: `Confirmatory Testing & Clinical Follow-up: ${currentPrediction.patient_name}`,
      description: currentPrediction.recommendation,
      intervention: currentPrediction.risk_level === 'high' ? 'Urgent Diagnostic Laboratory Order' : 'Preventative Monitoring',
      status: 'TODO',
      priority: currentPrediction.risk_level === 'high' ? 'URGENT' : 'MEDIUM',
      due_date: dueDate,
      assigned_to: 'Care Coordination Team'
    });
    setTaskCreated(true);
  };

  if (!currentPrediction) return null;

  const probabilityPct = Math.round(currentPrediction.probability * 100);
  const isHighRisk = currentPrediction.risk_level === 'high';
  const isModerateRisk = currentPrediction.risk_level === 'moderate';

  const riskColorBg = isHighRisk 
    ? 'bg-red-50 border-red-200 text-red-700' 
    : isModerateRisk 
    ? 'bg-amber-50 border-amber-200 text-amber-700' 
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  return (
    <div className="space-y-6">
      {/* Top Clinical Header & Patient Cohort Quick Loader */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tracking-wider">
                Phase 7: Agentic Screening Interface
              </span>
              <span className="text-xs text-slate-500 font-medium">ITDO Stage 1 (Insights)</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">
              Patient Risk Stratification & AI Diagnostic Copilot
            </h2>
            <p className="text-xs text-slate-500">
              Interactive clinical parameters with strict deterministic feature flagging before agentic LLM reasoning.
            </p>
          </div>

          {/* Quick Preloaded Cohort Selector (Diabetes) */}
          {selectedDisease === 'diabetes' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 whitespace-nowrap font-bold uppercase tracking-wider text-[11px]">Load Patient:</span>
              <div className="flex gap-1.5">
                {SAMPLE_PATIENT_CASES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap font-semibold ${
                      selectedCohort === sample.id
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sample.name} ({sample.category.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Feature Controls & Inputs (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            
            {/* Patient Header Details */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Patient Ref ID</label>
                  <input
                    type="text"
                    value={patientRef}
                    onChange={(e) => setPatientRef(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-mono w-32 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 w-40 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Target Condition</span>
                <span className="text-xs font-bold text-teal-700 uppercase">
                  {selectedDisease === 'diabetes' ? 'Type-2 Diabetes (Pima)' : selectedDisease === 'heart' ? 'Cardiovascular Disease' : 'Parkinson Disease'}
                </span>
              </div>
            </div>

            {/* Disease Specific Input Sliders */}
            {selectedDisease === 'diabetes' && (
              <div className="space-y-4">
                
                {/* Glucose */}
                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center">
                      <span>Fasting Plasma Glucose (mg/dL)</span>
                      <span className="ml-2 text-[10px] text-slate-500 font-mono font-normal">Normal: 70 - 99</span>
                    </label>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      diabetesFeatures.glucose > 99 
                        ? diabetesFeatures.glucose >= 126 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {diabetesFeatures.glucose} mg/dL
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    step="1"
                    value={diabetesFeatures.glucose}
                    onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, glucose: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>50 (Hypo)</span>
                    <span className="text-emerald-700 font-semibold">99 (Normal Max)</span>
                    <span className="text-amber-700 font-semibold">125 (Pre-diabetic)</span>
                    <span className="text-red-700 font-semibold">250 (Severe)</span>
                  </div>
                </div>

                {/* BMI */}
                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center">
                      <span>Body Mass Index (BMI kg/m²)</span>
                      <span className="ml-2 text-[10px] text-slate-500 font-mono font-normal">Normal: 18.5 - 24.9</span>
                    </label>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      diabetesFeatures.bmi >= 30 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : diabetesFeatures.bmi > 24.9 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {diabetesFeatures.bmi.toFixed(1)} kg/m²
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15.0"
                    max="55.0"
                    step="0.1"
                    value={diabetesFeatures.bmi}
                    onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, bmi: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                {/* 2-Column Grid for Secondary Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Age */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Patient Age</label>
                      <span className="text-xs font-bold font-mono text-teal-700">{diabetesFeatures.age} yrs</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="90"
                      value={diabetesFeatures.age}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, age: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Diastolic Blood Pressure */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Diastolic BP (mmHg)</label>
                      <span className={`text-xs font-bold font-mono ${diabetesFeatures.bloodPressure > 80 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {diabetesFeatures.bloodPressure} mmHg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="130"
                      value={diabetesFeatures.bloodPressure}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, bloodPressure: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Insulin */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">2-Hour Serum Insulin</label>
                      <span className={`text-xs font-bold font-mono ${diabetesFeatures.insulin > 166 ? 'text-red-700 font-extrabold' : 'text-slate-700'}`}>
                        {diabetesFeatures.insulin} µIU/mL
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="850"
                      step="5"
                      value={diabetesFeatures.insulin}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, insulin: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Diabetes Pedigree Function */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Pedigree Risk Score</label>
                      <span className="text-xs font-bold font-mono text-teal-700">
                        {diabetesFeatures.diabetesPedigree.toFixed(3)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="2.5"
                      step="0.01"
                      value={diabetesFeatures.diabetesPedigree}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, diabetesPedigree: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Pregnancies */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Pregnancies</label>
                      <span className="text-xs font-bold font-mono text-slate-700">{diabetesFeatures.pregnancies}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="17"
                      value={diabetesFeatures.pregnancies}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, pregnancies: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Skin Thickness */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Triceps Skinfold (mm)</label>
                      <span className="text-xs font-bold font-mono text-slate-700">{diabetesFeatures.skinThickness} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="99"
                      value={diabetesFeatures.skinThickness}
                      onChange={(e) => setDiabetesFeatures({ ...diabetesFeatures, skinThickness: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Heart Disease Inputs */}
            {selectedDisease === 'heart' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">Resting Blood Pressure</span>
                    <span className="font-mono text-red-600 font-bold">{heartFeatures.trestbps} mmHg</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="200"
                    value={heartFeatures.trestbps}
                    onChange={(e) => setHeartFeatures({ ...heartFeatures, trestbps: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-rose-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">Serum Cholesterol</span>
                    <span className="font-mono text-red-600 font-bold">{heartFeatures.chol} mg/dL</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="450"
                    value={heartFeatures.chol}
                    onChange={(e) => setHeartFeatures({ ...heartFeatures, chol: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-rose-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">Max Heart Rate Achieved</span>
                    <span className="font-mono text-red-600 font-bold">{heartFeatures.thalach} bpm</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="210"
                    value={heartFeatures.thalach}
                    onChange={(e) => setHeartFeatures({ ...heartFeatures, thalach: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-rose-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">ST Depression (oldpeak)</span>
                    <span className="font-mono text-red-600 font-bold">{heartFeatures.oldpeak} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6.0"
                    step="0.1"
                    value={heartFeatures.oldpeak}
                    onChange={(e) => setHeartFeatures({ ...heartFeatures, oldpeak: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Parkinson Disease Inputs */}
            {selectedDisease === 'parkinsons' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">Vocal Jitter (%)</span>
                    <span className="font-mono text-purple-700 font-bold">{(parkinsonsFeatures.jitterPct * 100).toFixed(3)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.03"
                    step="0.0005"
                    value={parkinsonsFeatures.jitterPct}
                    onChange={(e) => setParkinsonsFeatures({ ...parkinsonsFeatures, jitterPct: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 font-bold">Harmonics-to-Noise (HNR)</span>
                    <span className="font-mono text-purple-700 font-bold">{parkinsonsFeatures.hnr.toFixed(1)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="35"
                    step="0.5"
                    value={parkinsonsFeatures.hnr}
                    onChange={(e) => setParkinsonsFeatures({ ...parkinsonsFeatures, hnr: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Deterministic Abnormal Flags Bar (Hard-coded Clinical Rules) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deterministic Feature Flags ({currentPrediction.flags.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono font-medium">Pre-condition for Agentic LLM</span>
            </div>

            {currentPrediction.flags.length === 0 ? (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>All measured biological parameters fall within standard healthy reference limits.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {currentPrediction.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border-l-4 border-red-500 border-y border-r border-slate-200 p-2.5 rounded-r-lg text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-slate-800 font-semibold">{flag}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                      ABNORMAL
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Risk Probability Gauge & Agentic Clinical Reasoning (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Calibrated Risk Probability Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">ML Pipeline Inference</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Calibrated Risk Stratification</h3>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${riskColorBg}`}>
                {currentPrediction.risk_level.toUpperCase()} RISK
              </div>
            </div>

            {/* Circular Visual Gauge */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={
                      isHighRisk ? 'text-red-500' : isModerateRisk ? 'text-amber-500' : 'text-teal-600'
                    }
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - currentPrediction.probability)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {probabilityPct}%
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">
                    Probability
                  </span>
                </div>
              </div>

              {/* Threshold Comparison */}
              <div className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-3 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-600 font-medium">Trigger Threshold:</span>
                <span className="text-teal-700 font-bold">{(settings.alertThreshold * 100).toFixed(0)}%</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-medium">Status:</span>
                <span className={currentPrediction.probability >= settings.alertThreshold ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {currentPrediction.probability >= settings.alertThreshold ? 'ALERT TRIGGERED' : 'SUB-THRESHOLD'}
                </span>
              </div>
            </div>

            {/* Action Bar: Trigger Triage Alert & Create Care Task */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTriggerAlert}
                disabled={alertTriggered}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  alertTriggered
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{alertTriggered ? 'Alert Queued' : 'Trigger Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleCreateCareTask}
                disabled={taskCreated}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  taskCreated
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{taskCreated ? 'Task Assigned' : 'Create Task'}</span>
              </button>
            </div>
          </div>

          {/* Agentic Clinical Explanation Card (Pydantic / Gemini) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">Agentic Clinical Explanation</h3>
              </div>
              <button
                type="button"
                onClick={handleRunAgentReasoning}
                disabled={isExplaining}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 rounded-md text-xs font-bold transition-all"
              >
                <Zap className="w-3 h-3" />
                <span>{isExplaining ? 'Reasoning...' : 'Run Gemini AI'}</span>
              </button>
            </div>

            {/* Key Risk Factors */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
                Primary Risk Factors
              </span>
              <ul className="space-y-1.5">
                {currentPrediction.key_factors.map((factor, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span className="font-medium">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Evidence-Based Next Clinical Steps */}
            <div className="space-y-2 bg-teal-50/60 p-3.5 rounded-lg border border-teal-100">
              <span className="text-[10px] font-mono uppercase text-teal-800 font-bold flex items-center gap-1 tracking-wider">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Recommended Clinical Protocol</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {currentPrediction.recommendation}
              </p>
            </div>

            {/* Regulatory Clinical Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-900 leading-tight">
                  {currentPrediction.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

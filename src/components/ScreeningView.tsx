import React, { useState, useEffect } from 'react';
import { Circle, Play, Loader2 } from 'lucide-react';
import {
  DiseaseType,
  PatientDiabetesFeatures,
  PatientHeartFeatures,
  PatientParkinsonsFeatures,
  PredictionResult,
  AppSettings
} from '../types';
import {
  predictDiabetesProbability,
  predictHeartProbability,
  predictParkinsonsProbability,
  generateDeterministicClinicalExplanation
} from '../lib/ml-engine';
import { flagDiabetesFeatures, flagHeartFeatures, flagParkinsonsFeatures } from '../lib/deterministic-flags';
import { SAMPLE_PATIENT_CASES, PreloadedPatientCase } from '../lib/sample-data';
import { ChatContext } from './ChatWidget';

interface ScreeningViewProps {
  selectedDisease: DiseaseType;
  settings: AppSettings;
  onPredictionChange?: (context: ChatContext | null) => void;
}

const RISK_OPACITY: Record<string, number> = { high: 1, moderate: 0.55, low: 0.22 };

function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

const Field: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  digits?: number;
}> = ({ label, value, onChange, min, max, step = 1, unit = '', digits = 0 }) => (
  <div>
    <div className="flex justify-between items-center mb-1 gap-2">
      <label className="text-xs font-medium text-zinc-500 flex-shrink-0">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={Number(value.toFixed(digits))}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-16 text-xs font-mono font-semibold text-zinc-900 text-right bg-zinc-900/5 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {unit && <span className="text-[10px] text-zinc-400 w-10">{unit}</span>}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-zinc-900/10 rounded-full appearance-none cursor-pointer accent-zinc-900"
    />
  </div>
);

export const ScreeningView: React.FC<ScreeningViewProps> = ({ selectedDisease, settings, onPredictionChange }) => {
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
  const [selectedCohort, setSelectedCohort] = useState<string>('PT-8842');
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Reset any previous result when the disease or patient changes — inputs alone
  // never trigger a new model call, only the Run Prediction button does.
  useEffect(() => {
    setCurrentPrediction(null);
    setLatencyMs(null);
    onPredictionChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisease]);

  const rawFeatures =
    selectedDisease === 'diabetes' ? diabetesFeatures : selectedDisease === 'heart' ? heartFeatures : parkinsonsFeatures;

  const liveFlags =
    selectedDisease === 'diabetes'
      ? flagDiabetesFeatures(diabetesFeatures)
      : selectedDisease === 'heart'
      ? flagHeartFeatures(heartFeatures)
      : flagParkinsonsFeatures(parkinsonsFeatures);

  const runPrediction = async () => {
    setIsPredicting(true);
    let proba = 0;
    let risk_level: 'low' | 'moderate' | 'high' = 'low';
    let model_name = '';
    let latency = 0;

    if (selectedDisease === 'diabetes') {
      const res = await predictDiabetesProbability(diabetesFeatures);
      proba = res.probability; risk_level = res.risk_level; model_name = res.model_name; latency = res.latency_ms;
    } else if (selectedDisease === 'heart') {
      const res = await predictHeartProbability(heartFeatures);
      proba = res.probability; risk_level = res.risk_level; model_name = res.model_name; latency = res.latency_ms;
    } else {
      const res = await predictParkinsonsProbability(parkinsonsFeatures);
      proba = res.probability; risk_level = res.risk_level; model_name = res.model_name; latency = res.latency_ms;
    }

    const defaultExpl = generateDeterministicClinicalExplanation(proba, liveFlags.flags, selectedDisease, settings.customDisclaimer);

    const prediction: PredictionResult = {
      prediction_id: 'PRED-' + Math.floor(1000 + Math.random() * 9000),
      disease_type: selectedDisease,
      patient_ref: patientRef,
      probability: proba,
      risk_level,
      flags: liveFlags.flags,
      abnormal_details: liveFlags.details,
      key_factors: defaultExpl.key_factors,
      recommendation: defaultExpl.recommendation,
      disclaimer: defaultExpl.disclaimer,
      model_version: '3.2.0',
      model_name,
      created_at: new Date().toISOString(),
      raw_features: rawFeatures as any
    };

    setCurrentPrediction(prediction);
    setLatencyMs(latency);
    onPredictionChange?.({
      disease_type: selectedDisease,
      probability: proba,
      risk_level,
      flags: liveFlags.flags,
      model_name,
      raw_features: rawFeatures as any
    });
    setIsPredicting(false);
  };

  const handleLoadSample = (sample: PreloadedPatientCase) => {
    setSelectedCohort(sample.id);
    setPatientRef(sample.id);
    setDiabetesFeatures(sample.features);
  };

  const probabilityPct = currentPrediction ? Math.round(currentPrediction.probability * 100) : 0;
  const opacity = currentPrediction ? RISK_OPACITY[currentPrediction.risk_level] : 0;
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Risk Screening</h1>
          <p className="text-xs text-zinc-400">Set patient parameters, then run the model</p>
        </div>

        {selectedDisease === 'diabetes' && (
          <div className="flex gap-1.5 overflow-x-auto">
            {SAMPLE_PATIENT_CASES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap font-medium ${
                  selectedCohort === sample.id
                    ? 'bg-zinc-900 text-zinc-50'
                    : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-7 bg-white/70 border border-zinc-900/10 rounded-2xl p-5 space-y-5">
          {selectedDisease === 'diabetes' && (
            <div className="space-y-4">
              <Field label="Glucose" value={diabetesFeatures.glucose} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, glucose: v })} min={50} max={250} unit="mg/dL" />
              <Field label="BMI" value={diabetesFeatures.bmi} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, bmi: v })} min={15} max={55} step={0.1} digits={1} unit="kg/m²" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Age" value={diabetesFeatures.age} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, age: v })} min={18} max={90} unit="yrs" />
                <Field label="Diastolic BP" value={diabetesFeatures.bloodPressure} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, bloodPressure: v })} min={40} max={130} unit="mmHg" />
                <Field label="Insulin" value={diabetesFeatures.insulin} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, insulin: v })} min={0} max={850} step={5} unit="µIU/mL" />
                <Field label="Pedigree" value={diabetesFeatures.diabetesPedigree} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, diabetesPedigree: v })} min={0.05} max={2.5} step={0.01} digits={2} />
                <Field label="Pregnancies" value={diabetesFeatures.pregnancies} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, pregnancies: v })} min={0} max={17} />
                <Field label="Skin Thickness" value={diabetesFeatures.skinThickness} onChange={(v) => setDiabetesFeatures({ ...diabetesFeatures, skinThickness: v })} min={0} max={99} unit="mm" />
              </div>
            </div>
          )}

          {selectedDisease === 'heart' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Resting BP" value={heartFeatures.trestbps} onChange={(v) => setHeartFeatures({ ...heartFeatures, trestbps: v })} min={90} max={200} unit="mmHg" />
              <Field label="Cholesterol" value={heartFeatures.chol} onChange={(v) => setHeartFeatures({ ...heartFeatures, chol: v })} min={120} max={450} unit="mg/dL" />
              <Field label="Max Heart Rate" value={heartFeatures.thalach} onChange={(v) => setHeartFeatures({ ...heartFeatures, thalach: v })} min={70} max={210} unit="bpm" />
              <Field label="ST Depression" value={heartFeatures.oldpeak} onChange={(v) => setHeartFeatures({ ...heartFeatures, oldpeak: v })} min={0} max={6} step={0.1} digits={1} />
            </div>
          )}

          {selectedDisease === 'parkinsons' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vocal Jitter" value={parkinsonsFeatures.jitterPct * 100} onChange={(v) => setParkinsonsFeatures({ ...parkinsonsFeatures, jitterPct: v / 100 })} min={0.1} max={3} step={0.05} digits={2} unit="%" />
              <Field label="Harmonics-to-Noise" value={parkinsonsFeatures.hnr} onChange={(v) => setParkinsonsFeatures({ ...parkinsonsFeatures, hnr: v })} min={8} max={35} step={0.5} digits={1} unit="dB" />
            </div>
          )}

          {/* Live deterministic flags — no model call needed */}
          {liveFlags.flags.length > 0 && (
            <div className="pt-3 border-t border-zinc-900/10 space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Flags</span>
              {liveFlags.flags.map((flag, idx) => (
                <div key={idx} className="text-xs text-zinc-700 flex items-start gap-2">
                  <Circle className="w-1.5 h-1.5 mt-1 flex-shrink-0" fill="currentColor" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="lg:col-span-5 space-y-4">
          <button
            type="button"
            onClick={runPrediction}
            disabled={isPredicting}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-50 rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            {isPredicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
            <span>{isPredicting ? 'Running model…' : currentPrediction ? 'Run again' : 'Run Prediction'}</span>
          </button>

          <div className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5 flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" strokeWidth="7" stroke="currentColor" fill="transparent" className="text-zinc-900/10" />
                {currentPrediction && (
                  <circle
                    cx="50" cy="50" r="40" strokeWidth="7" strokeLinecap="round" fill="transparent"
                    stroke="currentColor"
                    className="text-zinc-900"
                    style={{ opacity, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - currentPrediction.probability) }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-900 font-mono">
                  {currentPrediction ? `${probabilityPct}%` : '—'}
                </span>
              </div>
            </div>

            {currentPrediction ? (
              <>
                <div
                  className="mt-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: `rgba(24,24,27,${opacity * 0.12})`, color: `rgba(24,24,27,${0.5 + opacity * 0.5})` }}
                >
                  <Circle className="w-2 h-2" fill="currentColor" style={{ opacity }} />
                  {currentPrediction.risk_level.toUpperCase()} RISK
                </div>
                {latencyMs !== null && (
                  <span className="mt-2 text-[10px] text-zinc-400 font-mono">Predicted in {formatLatency(latencyMs)}</span>
                )}
              </>
            ) : (
              <span className="mt-3 text-xs text-zinc-400">No prediction yet</span>
            )}
          </div>

          {currentPrediction && (
            <div className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5 space-y-3">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Why</span>
              <ul className="space-y-1.5">
                {currentPrediction.key_factors.map((factor, i) => (
                  <li key={i} className="text-xs text-zinc-700 flex items-start gap-2">
                    <span className="text-zinc-300 font-bold">·</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-zinc-600 leading-relaxed pt-2 border-t border-zinc-900/10">
                {currentPrediction.recommendation}
              </p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{currentPrediction.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

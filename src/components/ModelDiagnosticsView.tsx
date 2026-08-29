import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Sliders,
  Cpu,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { DiseaseType } from '../types';
import { getModelMetrics } from '../lib/ml-engine';

interface ModelDiagnosticsViewProps {
  selectedDisease: DiseaseType;
}

export const ModelDiagnosticsView: React.FC<ModelDiagnosticsViewProps> = ({ selectedDisease }) => {
  const metrics = getModelMetrics(selectedDisease);

  // Transform feature importances to array for bar chart
  const featureData = Object.entries(metrics.feature_importances).map(([name, val]) => ({
    name,
    importance: Number((val * 100).toFixed(1)),
    raw: val
  })).sort((a, b) => b.importance - a.importance);

  // Biological Zeros Audit Table Data (Pima Indian Dataset)
  const auditData = [
    { feature: 'Glucose', zeroCount: 5, zeroPct: '0.7%', normalRange: '70 - 99 mg/dL', action: 'Replaced with np.nan -> Median Imputed' },
    { feature: 'BloodPressure', zeroCount: 35, zeroPct: '4.6%', normalRange: '60 - 80 mmHg', action: 'Replaced with np.nan -> Median Imputed' },
    { feature: 'SkinThickness', zeroCount: 227, zeroPct: '29.6%', normalRange: '10 - 50 mm', action: 'Replaced with np.nan -> Median Imputed' },
    { feature: 'Insulin', zeroCount: 374, zeroPct: '48.7%', normalRange: '16 - 166 µIU/mL', action: 'Replaced with np.nan -> Median Imputed' },
    { feature: 'BMI', zeroCount: 11, zeroPct: '1.4%', normalRange: '18.5 - 24.9 kg/m²', action: 'Replaced with np.nan -> Median Imputed' },
    { feature: 'Age', zeroCount: 0, zeroPct: '0.0%', normalRange: '0 - 120 yrs', action: 'Direct Standard Scaling' },
    { feature: 'Pregnancies', zeroCount: 111, zeroPct: '14.5%', normalRange: '0 - 20', action: 'Valid biological zeros preserved' },
    { feature: 'DiabetesPedigree', zeroCount: 0, zeroPct: '0.0%', normalRange: '0.08 - 2.42', action: 'Direct Standard Scaling' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tracking-wider">
                CRISP-DM Phase 4 & 5: Evaluation & Validation
              </span>
              <span className="text-xs text-slate-500 font-medium">Pipeline Diagnostic Reports</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">Model Performance & Machine Learning Diagnostics</h2>
            <p className="text-xs text-slate-500">
              Evaluated on 80/20 holdout split and 5-fold stratified cross-validation (Target AUC ≥ 0.80).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold">
              Model: <strong className="text-teal-700">{metrics.model_name}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Holdout ROC-AUC</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-700 font-mono">
              {(metrics.auc_roc * 100).toFixed(2)}%
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">Goal ≥ 80%</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-medium">5-Fold CV: {(metrics.cv_mean_auc * 100).toFixed(1)}% ± {(metrics.cv_std_auc * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Classification Accuracy</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(metrics.accuracy * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-medium">Balanced Holdout Set</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Precision / Recall</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-700 font-mono">
              {(metrics.precision * 100).toFixed(1)}% / {(metrics.recall * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-medium">Positive Class Sensitivity</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Harmonic F1-Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {(metrics.f1_score * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-medium">Clinical Balance</span>
        </div>
      </div>

      {/* Visual Graphs (ROC Curve & Feature Importances) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ROC Curve (6 Columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Receiver Operating Characteristic (ROC Curve)</h3>
              <p className="text-xs text-slate-500 font-medium">True Positive Rate vs. False Positive Rate across classification thresholds</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              AUC = {metrics.auc_roc.toFixed(4)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.roc_curve_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fpr" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 1]} />
                <YAxis dataKey="tpr" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  formatter={(val: any) => [Number(val).toFixed(3), 'TPR']}
                  labelFormatter={(lbl: any) => `FPR: ${Number(lbl).toFixed(3)}`}
                />
                <Line type="monotone" dataKey="tpr" stroke="#0d9488" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>False Positive Rate (1 - Specificity)</span>
            <span className="text-teal-700 font-bold">Random Chance Baseline: 0.50</span>
          </div>
        </div>

        {/* Feature Importance Bar Chart (6 Columns) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Random Forest Gini Feature Importances</h3>
              <p className="text-xs text-slate-500 font-medium">Relative contribution of clinical variables to model decision trees</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 35]} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  formatter={(val: any) => [`${val}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]}>
                  {featureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0f766e' : index === 1 ? '#0d9488' : '#14b8a6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Data Audit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Confusion Matrix (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Holdout Confusion Matrix</h3>
            <p className="text-xs text-slate-500 font-medium">Holdout evaluation sample (n=154 patients)</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold tracking-wider block">True Negatives (TN)</span>
              <span className="text-3xl font-black text-emerald-950 font-mono mt-1 block">
                {metrics.confusion_matrix.matrix[0][0]}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Correctly Non-Diabetic</span>
            </div>

            <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 text-center">
              <span className="text-[10px] uppercase font-mono text-red-700 font-bold tracking-wider block">False Positives (FP)</span>
              <span className="text-3xl font-black text-red-950 font-mono mt-1 block">
                {metrics.confusion_matrix.matrix[0][1]}
              </span>
              <span className="text-[10px] text-red-700 font-medium">Over-stratified</span>
            </div>

            <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 text-center">
              <span className="text-[10px] uppercase font-mono text-red-700 font-bold tracking-wider block">False Negatives (FN)</span>
              <span className="text-3xl font-black text-red-950 font-mono mt-1 block">
                {metrics.confusion_matrix.matrix[1][0]}
              </span>
              <span className="text-[10px] text-red-700 font-medium">Under-stratified</span>
            </div>

            <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 text-center">
              <span className="text-[10px] uppercase font-mono text-teal-800 font-bold tracking-wider block">True Positives (TP)</span>
              <span className="text-3xl font-black text-teal-950 font-mono mt-1 block">
                {metrics.confusion_matrix.matrix[1][1]}
              </span>
              <span className="text-[10px] text-teal-700 font-medium">Correctly Flagged Diabetic</span>
            </div>
          </div>
        </div>

        {/* Biological Zeros Audit Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">CRISP-DM Phase 1 Data Audit: Zero-to-NaN Imputation</h3>
            <p className="text-xs text-slate-500 font-medium">Biological zero audit and SimpleImputer(strategy='median') pipeline execution</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Biological Zeros</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">% Missing</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Normal Range</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider">Pipeline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-slate-900">{row.feature}</td>
                    <td className="p-2.5 font-mono text-red-600 font-bold">{row.zeroCount}</td>
                    <td className="p-2.5 font-mono text-slate-600 font-medium">{row.zeroPct}</td>
                    <td className="p-2.5 text-slate-500 font-medium">{row.normalRange}</td>
                    <td className="p-2.5 text-teal-700 font-mono text-[11px] font-semibold">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

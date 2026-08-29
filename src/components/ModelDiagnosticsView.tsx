import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { DiseaseType, ModelMetrics } from '../types';
import { getModelMetrics, fetchModelMetrics } from '../lib/ml-engine';

interface ModelDiagnosticsViewProps {
  selectedDisease: DiseaseType;
}

const GRID = '#e4e4e7';
const AXIS = '#a1a1aa';
const INK = '#18181b';

export const ModelDiagnosticsView: React.FC<ModelDiagnosticsViewProps> = ({ selectedDisease }) => {
  const [metrics, setMetrics] = useState<ModelMetrics>(() => getModelMetrics(selectedDisease));
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setMetrics(getModelMetrics(selectedDisease));
    fetchModelMetrics(selectedDisease).then(({ metrics: fetched, source }) => {
      if (cancelled) return;
      setMetrics(fetched);
      setIsLive(source === 'trained_sav_model_holdout_eval');
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedDisease]);

  const featureData = Object.entries(metrics.feature_importances)
    .map(([name, val]: [string, number]) => ({ name, importance: Number((val * 100).toFixed(1)) }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6);

  const total =
    metrics.confusion_matrix.matrix[0][0] + metrics.confusion_matrix.matrix[0][1] +
    metrics.confusion_matrix.matrix[1][0] + metrics.confusion_matrix.matrix[1][1];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Model</h1>
          <p className="text-xs text-zinc-400">{metrics.model_name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${isLoading ? 'text-zinc-400' : 'text-zinc-700'} bg-zinc-900/5`}>
          {isLoading ? 'Syncing…' : isLive ? 'Live holdout eval' : 'Static benchmark'}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ROC-AUC', value: `${(metrics.auc_roc * 100).toFixed(1)}%` },
          { label: 'Accuracy', value: `${(metrics.accuracy * 100).toFixed(1)}%` },
          { label: 'Precision / Recall', value: `${(metrics.precision * 100).toFixed(0)} / ${(metrics.recall * 100).toFixed(0)}` },
          { label: 'F1', value: `${(metrics.f1_score * 100).toFixed(1)}%` }
        ].map((m) => (
          <div key={m.label} className="bg-white/70 border border-zinc-900/10 rounded-xl p-3.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wide block">{m.label}</span>
            <span className="text-xl font-bold text-zinc-900 font-mono">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ROC */}
        <div className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5">
          <span className="text-xs font-medium text-zinc-500">ROC Curve</span>
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.roc_curve_data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis type="number" dataKey="fpr" tick={{ fill: AXIS, fontSize: 10 }} domain={[0, 1]} />
                <YAxis type="number" dataKey="tpr" tick={{ fill: AXIS, fontSize: 10 }} domain={[0, 1]} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: 8 }} formatter={(v: any) => Number(v).toFixed(2)} />
                <Line type="monotone" dataKey="tpr" stroke={INK} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature importance */}
        <div className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5">
          <span className="text-xs font-medium text-zinc-500">Top Features</span>
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: INK, fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: 8 }} formatter={(v: any) => [`${v}%`, '']} />
                <Bar dataKey="importance" fill={INK} radius={[0, 3, 3, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion matrix */}
      <div className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500">Confusion Matrix</span>
          <span className="text-[10px] text-zinc-400">n={total}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: metrics.confusion_matrix.labels[0], value: metrics.confusion_matrix.matrix[0][0], sub: 'True negative' },
            { label: 'False positive', value: metrics.confusion_matrix.matrix[0][1], sub: '' },
            { label: 'False negative', value: metrics.confusion_matrix.matrix[1][0], sub: '' },
            { label: metrics.confusion_matrix.labels[1], value: metrics.confusion_matrix.matrix[1][1], sub: 'True positive' }
          ].map((c, i) => (
            <div key={i} className="bg-zinc-900/5 rounded-xl p-3 text-center">
              <span className="text-2xl font-bold text-zinc-900 font-mono block">{c.value}</span>
              <span className="text-[10px] text-zinc-500">{c.sub || c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

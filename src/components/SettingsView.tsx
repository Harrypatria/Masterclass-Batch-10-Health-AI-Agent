import React from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  Sparkles, 
  FileText, 
  Save, 
  CheckCircle2,
  Database,
  Lock
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [formState, setFormState] = React.useState<AppSettings>(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tracking-wider">
            System & Clinical Safety Parameters
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">Clinical Decision Support Configuration</h2>
        <p className="text-xs text-slate-500">
          Tune automated triage thresholds, agentic LLM parameters, and clinical governance protocols.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Triage Thresholds Section */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">ITDO Automated Trigger Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <label className="text-slate-700 font-bold uppercase tracking-wider text-[11px]">Critical Alert Threshold (High Risk)</label>
                <span className="font-mono font-bold text-red-600">
                  {(formState.alertThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.90"
                step="0.05"
                value={formState.alertThreshold}
                onChange={(e) => setFormState({ ...formState, alertThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 accent-red-600 cursor-pointer rounded-lg"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                Probabilities at or above this value automatically trigger priority triage alerts.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <label className="text-slate-700 font-bold uppercase tracking-wider text-[11px]">Moderate Risk Threshold</label>
                <span className="font-mono font-bold text-amber-700">
                  {(formState.moderateThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.60"
                step="0.05"
                value={formState.moderateThreshold}
                onChange={(e) => setFormState({ ...formState, moderateThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 accent-amber-600 cursor-pointer rounded-lg"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                Triggers Tier-2 preventative care lifestyle coaching protocols.
              </span>
            </div>
          </div>
        </div>

        {/* Model Architecture & Agentic Settings */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Machine Learning & Reasoning Engine</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Champion Model Pipeline</label>
              <select
                value={formState.defaultModel}
                onChange={(e) => setFormState({ ...formState, defaultModel: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="random_forest">RandomForestClassifier + SimpleImputer Pipeline (Champion)</option>
                <option value="logistic_regression">LogisticRegression + Scaler Pipeline (Candidate)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Agentic Gemini 3.7 Reasoning</span>
                <span className="text-[10px] text-slate-500 font-medium">Enables server-side structured medical explanations</span>
              </div>
              <input
                type="checkbox"
                checked={formState.useAiReasoning}
                onChange={(e) => setFormState({ ...formState, useAiReasoning: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded bg-white border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Customization */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Regulatory Clinical Disclaimer Statement</h3>
          </div>

          <div>
            <textarea
              rows={3}
              value={formState.customDisclaimer}
              onChange={(e) => setFormState({ ...formState, customDisclaimer: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">
              Mandatory FDA / CE-mark advisory banner appended to all clinical risk outputs and exported reports.
            </span>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully.</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Changes take effect immediately across all sessions.</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Alert, ClinicalTask, DiseaseType } from '../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDisease: DiseaseType;
  alerts: Alert[];
  tasks: ClinicalTask[];
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  selectedDisease,
  alerts,
  tasks
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const highRiskAlerts = alerts.filter((a) => a.risk_level === 'high');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Clinical Triage & Risk Stratification Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
          
          {/* Header Metadata */}
          <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                AI Health Copilot Pro — Clinical Summary
              </h1>
              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                Target Condition: <span className="text-teal-700 font-bold uppercase">{selectedDisease}</span> | Framework: ITDO + CRISP-DM
              </p>
              <p className="text-slate-500 text-[11px] font-medium">
                Generated Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px] font-bold uppercase tracking-wider">
                AUDITED v3.1.0
              </span>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Active Triage Alerts</span>
              <span className="text-xl font-black text-red-600 font-mono mt-1 block">{alerts.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">{highRiskAlerts.length} Critical (≥85%)</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Care Operations Tasks</span>
              <span className="text-xl font-black text-teal-700 font-mono mt-1 block">{tasks.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">{tasks.filter(t => t.status === 'DONE').length} Completed</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Model Pipeline AUC</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">85.20%</span>
              <span className="text-[10px] text-slate-500 font-medium">Holdout Accuracy 78.57%</span>
            </div>
          </div>

          {/* High Risk Alert Cohort Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
              1. Stratified Priority Triage Cohort
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold uppercase tracking-wider">Alert ID</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider">Patient Ref</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider">Probability</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider">Triggered Flags</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500 font-medium">{a.id}</td>
                      <td className="p-2.5 font-bold text-slate-900 font-mono">{a.patient_name || a.patient_ref}</td>
                      <td className="p-2.5 font-mono font-bold text-red-600">
                        {(a.probability * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600 font-medium">{a.flags.join('; ')}</td>
                      <td className="p-2.5 font-mono text-[10px] font-bold text-slate-700">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Care Tasks Schedule */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
              2. Clinical Intervention Workflows (Operations)
            </h4>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{t.title}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
                    <span className="text-[10px] font-mono text-teal-700 font-medium mt-1 block">
                      Patient: {t.patient_name || t.patient_ref} | Due: {t.due_date} | Assignee: {t.assigned_to}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    t.status === 'DONE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Clinical Disclaimer */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed font-medium">
            <strong>Clinical Safety Disclaimer:</strong> AI Health Copilot Pro provides algorithmic clinical decision support
            for screening and risk stratification only. It is NOT a diagnostic device. All risk estimates and recommendations
            must be reviewed and confirmed by a licensed healthcare professional alongside diagnostic lab testing (HbA1c, OGTT, lipid panel).
          </div>
        </div>
      </div>
    </div>
  );
};

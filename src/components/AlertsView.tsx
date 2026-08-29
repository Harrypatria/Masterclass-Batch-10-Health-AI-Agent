import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight,
  UserCheck,
  CheckSquare,
  Activity,
  Plus
} from 'lucide-react';
import { Alert, ClinicalTask } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  onUpdateAlertStatus: (id: string, status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED') => void;
  onAddTask: (task: Omit<ClinicalTask, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onUpdateAlertStatus,
  onAddTask
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(alerts[0] || null);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus = filterStatus === 'ALL' || alert.status === filterStatus;
    const matchesSearch =
      alert.patient_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.patient_name && alert.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const handleConvertAlertToTask = (alert: Alert) => {
    const dueDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    onAddTask({
      alert_id: alert.id,
      patient_ref: alert.patient_ref,
      patient_name: alert.patient_name,
      disease_type: alert.disease_type,
      title: `Triage Intervention: ${alert.patient_name || alert.patient_ref}`,
      description: `Patient flagged with ${(alert.probability * 100).toFixed(1)}% risk. Primary flags: ${alert.flags.join(', ')}`,
      intervention: 'Clinical Triage Evaluation & Lab Protocol',
      status: 'TODO',
      priority: alert.probability >= 0.85 ? 'URGENT' : 'HIGH',
      due_date: dueDate,
      assigned_to: alert.assigned_to || 'Care Coordinator'
    });
    onUpdateAlertStatus(alert.id, 'ACKNOWLEDGED');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 tracking-wider">
                ITDO Stage 2: Triggers Layer
              </span>
              <span className="text-xs text-slate-500 font-medium">Automated Triage & Critical Alerts</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">Clinical Triage Alert Management</h2>
            <p className="text-xs text-slate-500">
              High-risk cases exceeding probability threshold (≥70%) routed for immediate clinical evaluation.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Open Alerts</span>
                <span className="text-base font-bold text-slate-900 font-mono">{openCount}</span>
              </div>
            </div>

            <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Acknowledged</span>
                <span className="text-base font-bold text-slate-900 font-mono">{ackCount}</span>
              </div>
            </div>

            <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Resolved</span>
                <span className="text-base font-bold text-slate-900 font-mono">{resolvedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider ${
                filterStatus === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient name or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 w-full focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>
      </div>

      {/* Alerts Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
              No clinical alerts matching current filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const probaPct = Math.round(alert.probability * 100);

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/40 border-teal-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">{alert.patient_ref}</span>
                        <span className="text-xs font-bold text-slate-900">{alert.patient_name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          alert.status === 'OPEN'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 mt-2">
                        <span className="text-slate-400 font-medium">Flags ({alert.flags.length}): </span>
                        {alert.flags.slice(0, 2).join(', ')}
                        {alert.flags.length > 2 && '...'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-mono font-black text-red-600">{probaPct}%</span>
                      <span className="block text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider">Risk Probability</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    <span>Assigned: {alert.assigned_to}</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail & Dispatch Panel (5 Cols) */}
        <div className="lg:col-span-5">
          {selectedAlert ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Alert ID: {selectedAlert.id}</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedAlert.patient_name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-black text-red-600">
                    {(selectedAlert.probability * 100).toFixed(1)}%
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">ML Stratification</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold tracking-wider">
                  Update Triage State
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateAlertStatus(selectedAlert.id, 'OPEN')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      selectedAlert.status === 'OPEN'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAlertStatus(selectedAlert.id, 'ACKNOWLEDGED')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      selectedAlert.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAlertStatus(selectedAlert.id, 'RESOLVED')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      selectedAlert.status === 'RESOLVED'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* Abnormal Flags Details */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold tracking-wider">
                  Triggered Clinical Indicators
                </span>
                <div className="space-y-1.5">
                  {selectedAlert.flags.map((flag, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border-l-4 border-red-500 border-y border-r border-slate-200 text-xs text-slate-800 flex items-start gap-2 font-medium">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Task Dispatch Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleConvertAlertToTask(selectedAlert)}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Dispatch Clinical Care Task (ITDO Stage 4)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
              Select an alert to view clinical triage details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

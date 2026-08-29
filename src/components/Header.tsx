import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings, 
  Heart, 
  Sparkles,
  Stethoscope,
  BrainCircuit,
  FileText
} from 'lucide-react';
import { DiseaseType } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDisease: DiseaseType;
  setSelectedDisease: (disease: DiseaseType) => void;
  openAlertsCount: number;
  pendingTasksCount: number;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDisease,
  setSelectedDisease,
  openAlertsCount,
  pendingTasksCount,
  onOpenReportModal
}) => {
  const tabs = [
    { id: 'screening', label: 'Screening & AI Copilot', shortLabel: 'Predictor', icon: Stethoscope, badge: null },
    { id: 'alerts', label: 'Triage Alerts', shortLabel: 'Alerts', icon: ShieldAlert, badge: openAlertsCount > 0 ? openAlertsCount : null },
    { id: 'tasks', label: 'Care Operations', shortLabel: 'Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : null },
    { id: 'diagnostics', label: 'Model Insights', shortLabel: 'Model Insights', icon: BarChart3, badge: null },
    { id: 'cohort', label: 'Cohort Explorer', shortLabel: 'Cohort', icon: Users, badge: null },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-teal-100 flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  AI Health Copilot <span className="text-teal-600">Pro</span>
                </h1>
                <span className="hidden sm:inline-flex bg-teal-50 text-teal-700 border border-teal-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                  ITDO + CRISP-DM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                Clinical Risk Agent / v3.1.0
              </p>
            </div>
          </div>

          {/* Pill Navigation (Center) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-teal-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-100 text-red-600">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Disease Selector & Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Disease Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedDisease('diabetes')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedDisease === 'diabetes'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Diabetes (Pima Dataset)"
              >
                Diabetes
              </button>

              <button
                type="button"
                onClick={() => setSelectedDisease('heart')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedDisease === 'heart'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cardiovascular Disease"
              >
                Cardio
              </button>

              <button
                type="button"
                onClick={() => setSelectedDisease('parkinsons')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedDisease === 'parkinsons'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Parkinson Disease"
              >
                Parkinson
              </button>
            </div>

            {/* Quick Export Report Button */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="Generate Clinical Report"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Report</span>
            </button>

            {/* User Profile Badge */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">Dr. Harry Patria</p>
                <p className="text-[10px] text-slate-500 font-mono">Chief Data & AI Officer</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                HP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Pill Sub-Bar for smaller screens */}
      <div className="lg:hidden bg-slate-50 border-t border-slate-200 px-4 py-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-semibold bg-white border border-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.shortLabel}</span>
                {tab.badge !== null && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] font-black bg-red-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

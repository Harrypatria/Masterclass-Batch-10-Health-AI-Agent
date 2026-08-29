import React, { useState } from 'react';
import { Activity, Stethoscope, BarChart3, Menu, X, LogOut, Settings } from 'lucide-react';
import { DiseaseType } from '../types';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDisease: DiseaseType;
  setSelectedDisease: (disease: DiseaseType) => void;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { id: 'screening', label: 'Predict', icon: Stethoscope },
  { id: 'diagnostics', label: 'Model', icon: BarChart3 },
];

const DISEASES: { id: DiseaseType; label: string }[] = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'heart', label: 'Heart' },
  { id: 'parkinsons', label: 'Parkinson' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedDisease,
  setSelectedDisease,
  onLogout
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const NavButtons = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id);
              onNavigate?.();
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-zinc-900 text-zinc-50 font-semibold'
                : 'text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900 font-medium'
            } ${expanded ? '' : 'justify-center'}`}
            title={item.label}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {(expanded || mobileOpen) && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const DiseaseSelector = () => (
    <div className={`px-2 ${expanded || mobileOpen ? '' : 'flex justify-center'}`}>
      <div className={`flex bg-zinc-900/5 rounded-lg p-1 gap-0.5 ${expanded || mobileOpen ? '' : 'flex-col'}`}>
        {DISEASES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDisease(d.id)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedDisease === d.id
                ? 'bg-zinc-900 text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {expanded || mobileOpen ? d.label : d.label[0]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top strip */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white/80 backdrop-blur-md border-b border-zinc-900/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-zinc-50 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-zinc-900">Health Copilot</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-zinc-600 hover:bg-zinc-900/5"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-white h-full flex flex-col py-4 shadow-xl">
            <div className="flex items-center justify-between px-4 mb-4">
              <span className="font-semibold text-sm text-zinc-900">Health Copilot</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-900/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavButtons onNavigate={() => setMobileOpen(false)} />
            <div className="mt-4">
              <DiseaseSelector />
            </div>
            <button
              type="button"
              onClick={() => { setSettingsOpen(true); setMobileOpen(false); }}
              className="mx-2 mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>AI Copilot Settings</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-auto mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-zinc-900/10 bg-white/60 backdrop-blur-md h-screen sticky top-0 transition-all ${
          expanded ? 'w-56' : 'w-16'
        }`}
      >
        <div className={`flex items-center gap-2 h-16 px-4 ${expanded ? '' : 'justify-center px-0'}`}>
          <div className="w-8 h-8 rounded-md bg-zinc-900 text-zinc-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          {expanded && <span className="font-semibold text-sm text-zinc-900 truncate">Health Copilot</span>}
        </div>

        <div className="flex-1 flex flex-col gap-4 pt-2">
          <NavButtons />
          <DiseaseSelector />
        </div>

        <div className="p-2 space-y-1">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`w-full flex items-center gap-2 rounded-lg py-2 text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 transition-colors ${
              expanded ? 'px-3' : 'justify-center'
            }`}
            title="AI Copilot Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {expanded && <span className="text-xs font-medium">Settings</span>}
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`w-full flex items-center gap-2 rounded-lg py-2 text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 transition-colors ${
                expanded ? 'px-3' : 'justify-center'
              }`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {expanded && <span className="text-xs font-medium">Sign out</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

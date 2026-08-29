/**
 * AI Health Copilot Pro - Main Application Entry
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ScreeningView } from './components/ScreeningView';
import { ModelDiagnosticsView } from './components/ModelDiagnosticsView';
import { ChatWidget, ChatContext } from './components/ChatWidget';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DiseaseType, AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  alertThreshold: 0.70,
  moderateThreshold: 0.40,
  defaultModel: 'random_forest',
  useAiReasoning: true,
  customDisclaimer:
    'This is clinical decision support for screening only, not a diagnosis. ' +
    'Confirm with a licensed clinician and lab testing.',
  autoCreateTasksForHighRisk: true,
  theme: 'clinical-dark'
};

const AUTH_KEY = 'health-copilot-authed';

type View = 'landing' | 'login' | 'app';

export default function App() {
  const [view, setView] = useState<View>(() => (localStorage.getItem(AUTH_KEY) === '1' ? 'app' : 'landing'));
  const [activeTab, setActiveTab] = useState<string>('screening');
  const [selectedDisease, setSelectedDisease] = useState<DiseaseType>('diabetes');
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setView('landing');
  };

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('login')} />;
  }

  if (view === 'login') {
    return (
      <LoginPage
        onBack={() => setView('landing')}
        onSuccess={() => {
          localStorage.setItem(AUTH_KEY, '1');
          setView('app');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDisease={selectedDisease}
        setSelectedDisease={setSelectedDisease}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'screening' && (
          <ScreeningView
            selectedDisease={selectedDisease}
            settings={DEFAULT_SETTINGS}
            onPredictionChange={setChatContext}
          />
        )}

        {activeTab === 'diagnostics' && (
          <ModelDiagnosticsView selectedDisease={selectedDisease} />
        )}
      </main>

      <ChatWidget context={chatContext} />
    </div>
  );
}

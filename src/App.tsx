/**
 * AI Health Copilot Pro - Main Application Entry
 * Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
 * Version: 3.1.0 | Framework: ITDO Framework (Insights -> Triggers -> Decisions -> Operations) + CRISP-DM
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScreeningView } from './components/ScreeningView';
import { AlertsView } from './components/AlertsView';
import { TasksView } from './components/TasksView';
import { ModelDiagnosticsView } from './components/ModelDiagnosticsView';
import { CohortBatchView } from './components/CohortBatchView';
import { SettingsView } from './components/SettingsView';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { DiseaseType, Alert, ClinicalTask, AppSettings, TaskStatus } from './types';
import { INITIAL_ALERTS, INITIAL_TASKS } from './lib/sample-data';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('screening');
  const [selectedDisease, setSelectedDisease] = useState<DiseaseType>('diabetes');
  
  // ITDO State Management
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [tasks, setTasks] = useState<ClinicalTask[]>(INITIAL_TASKS);
  
  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    alertThreshold: 0.70,
    moderateThreshold: 0.40,
    defaultModel: 'random_forest',
    useAiReasoning: true,
    customDisclaimer:
      'AI Health Copilot Pro provides clinical decision support for screening and risk stratification only. ' +
      'It is NOT a diagnostic device. All risk estimates and recommendations must be reviewed and confirmed ' +
      'by a licensed healthcare professional alongside diagnostic lab testing (HbA1c, OGTT, lipid panel).',
    autoCreateTasksForHighRisk: true,
    theme: 'clinical-dark'
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Sync initial state from backend if available
  useEffect(() => {
    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch(() => {});

    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data);
        }
      })
      .catch(() => {});
  }, []);

  // Alert Handlers
  const handleAddAlert = (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Backend sync
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert)
    }).catch(() => {});
  };

  const handleUpdateAlertStatus = (id: string, status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updated_at: new Date().toISOString() } : a))
    );

    // Backend sync
    fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  // Task Handlers
  const handleAddTask = (taskData: Omit<ClinicalTask, 'id' | 'created_at' | 'updated_at'>) => {
    const newTask: ClinicalTask = {
      ...taskData,
      id: 'TSK-' + Math.floor(2000 + Math.random() * 8000),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);

    // Backend sync
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    }).catch(() => {});
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );

    // Backend sync
    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Backend sync
    fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDisease={selectedDisease}
        setSelectedDisease={setSelectedDisease}
        openAlertsCount={openAlertsCount}
        pendingTasksCount={pendingTasksCount}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'screening' && (
          <ScreeningView
            selectedDisease={selectedDisease}
            settings={settings}
            onAddAlert={handleAddAlert}
            onAddTask={handleAddTask}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onAddTask={handleAddTask}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'diagnostics' && (
          <ModelDiagnosticsView selectedDisease={selectedDisease} />
        )}

        {activeTab === 'cohort' && (
          <CohortBatchView
            onSelectPatientToScreen={(features) => {
              setActiveTab('screening');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* Clinical Report PDF / Print Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedDisease={selectedDisease}
        alerts={alerts}
        tasks={tasks}
      />

      {/* Persistent Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Health Copilot Pro — Full-Stack ML + Agentic AI Architecture (v3.1.0)</span>
          <span>CRISP-DM Lifecycle • ITDO Framework • Strict Deterministic Flagging</span>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { Activity, Stethoscope, MessageCircle, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Trained ML models',
    desc: 'Diabetes, heart disease and Parkinson’s risk from real trained .sav models, not hand-tuned heuristics.'
  },
  {
    icon: MessageCircle,
    title: 'Copilot chat',
    desc: 'Ask why a result came out the way it did — grounded in the exact inputs, model, and prediction.'
  },
  {
    icon: Gauge,
    title: 'Latency, visible',
    desc: 'Every prediction and every chat reply shows how long it actually took, end to end.'
  },
  {
    icon: ShieldCheck,
    title: 'Explainable by design',
    desc: 'Deterministic flags and plain-language reasoning accompany every risk score.'
  }
];

const ADVANTAGES = [
  'One click to run — nothing predicts silently in the background',
  'Type exact values or drag a slider, your choice',
  'Screening support only, with the disclaimer always visible'
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-zinc-900 text-zinc-50 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <span className="font-semibold text-sm">Health Copilot</span>
        </div>
        <button
          type="button"
          onClick={onLaunch}
          className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-900/5 px-3 py-1 rounded-full mb-5">
          Agentic AI &amp; RAG Masterclass
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Clinical risk screening, explained as it happens
        </h1>
        <p className="mt-4 text-zinc-500 max-w-lg text-sm sm:text-base">
          Run a trained model, see exactly why it scored what it scored, and ask a copilot chat
          anything about the result — with latency shown at every step.
        </p>
        <button
          type="button"
          onClick={onLaunch}
          className="mt-8 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          <span>Launch app</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full text-left">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white/70 border border-zinc-900/10 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-zinc-900/5 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-zinc-700" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Advantages */}
        <div className="mt-10 max-w-2xl w-full text-left bg-zinc-900/[0.03] border border-zinc-900/10 rounded-2xl p-6">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Why it feels different</span>
          <ul className="mt-3 space-y-2">
            {ADVANTAGES.map((a) => (
              <li key={a} className="text-sm text-zinc-700 flex items-start gap-2">
                <span className="text-zinc-300 font-bold mt-0.5">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/10 py-6 px-6 text-center">
        <p className="text-xs font-semibold text-zinc-700">Patria &amp; Co.</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">Masterclass Batch 10 · Agentic AI &amp; RAG</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">www.patriaco.co.uk</p>
      </footer>
    </div>
  );
};

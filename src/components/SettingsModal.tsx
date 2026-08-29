import React, { useState, useEffect } from 'react';
import { X, KeyRound, Loader2, CheckCircle2, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyStatus {
  configured: boolean;
  source: 'runtime' | 'env' | null;
  masked: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [input, setInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadStatus = () => {
    setIsLoading(true);
    fetch('/api/settings/openai-key')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setInput('');
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsSaving(true);
    try {
      await fetch('/api/settings/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: input.trim() })
      });
      setInput('');
      setSaved(true);
      loadStatus();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings/openai-key', { method: 'DELETE' });
      loadStatus();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white border border-zinc-900/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-900/5 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5 text-zinc-700" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-900">AI Copilot Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          OpenAI powers the copilot chat's reasoning. Set a key here, or via <code className="font-mono">OPENAI_API_KEY</code> in <code className="font-mono">.env</code> on the server.
        </p>

        {/* Status */}
        <div className="bg-zinc-900/5 rounded-xl p-3 mb-4 text-xs">
          {isLoading ? (
            <span className="text-zinc-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Checking…</span>
          ) : status?.configured ? (
            <div className="flex items-center justify-between">
              <span className="text-zinc-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active — {status.masked} ({status.source === 'runtime' ? 'set here' : '.env'})
              </span>
              {status.source === 'runtime' && (
                <button type="button" onClick={handleClear} disabled={isSaving} className="text-zinc-400 hover:text-zinc-700 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-zinc-500">Not configured — chat replies use a basic deterministic fallback.</span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 block">OpenAI API key</label>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            className="w-full text-sm bg-zinc-900/5 rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={isSaving || !input.trim()}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-50 rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save key</span>}
          </button>
          {saved && <p className="text-[11px] text-zinc-400 text-center">Saved for this session.</p>}
        </form>
      </div>
    </div>
  );
};

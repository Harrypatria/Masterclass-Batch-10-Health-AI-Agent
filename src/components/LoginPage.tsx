import React, { useState } from 'react';
import { Activity, Lock, ArrowLeft, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (resp.ok) {
        onSuccess();
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.error || 'Invalid username or password');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center px-6">
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <div className="w-9 h-9 rounded-lg bg-zinc-900 text-zinc-50 flex items-center justify-center mb-5">
        <Activity className="w-5 h-5" />
      </div>

      <div className="w-full max-w-sm bg-white/70 border border-zinc-900/10 rounded-2xl p-6">
        <h1 className="text-lg font-semibold text-center">Sign in</h1>
        <p className="text-xs text-zinc-400 text-center mt-1">Workshop access for Masterclass Batch 10</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full text-sm bg-zinc-900/5 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full text-sm bg-zinc-900/5 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {error && <p className="text-xs text-zinc-600 bg-zinc-900/5 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-50 rounded-lg py-2.5 text-sm font-semibold transition-colors mt-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isSubmitting ? 'Checking…' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

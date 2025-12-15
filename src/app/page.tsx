'use client';

import { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRun = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/manual-trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Unknown error occurred');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Supabase Keep-Alive
        </h1>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md flex flex-col items-center gap-6">
          <div className="text-center text-gray-400">
            <p>Prevent your Supabase project from pausing.</p>
            <p className="text-xs mt-2">Scheduled: Daily at 08:00 UTC</p>
          </div>

          <button
            onClick={handleRun}
            disabled={status === 'loading'}
            className={`
              group relative flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300
              ${status === 'loading' ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] active:scale-95'}
            `}
          >
            {status === 'loading' ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play className="fill-current" />
            )}
            {status === 'loading' ? 'Running...' : 'Run Now'}
          </button>

          {status !== 'idle' && (
            <div className={`
              flex items-center gap-3 p-4 rounded-lg w-full animate-in fade-in slide-in-from-bottom-4
              ${status === 'success' ? 'bg-green-900/30 text-green-400 border border-green-900' : ''}
              ${status === 'error' ? 'bg-red-900/30 text-red-400 border border-red-900' : ''}
            `}>
              {status === 'success' && <CheckCircle className="shrink-0" />}
              {status === 'error' && <XCircle className="shrink-0" />}
              <p className="break-all">{message}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

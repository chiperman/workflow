'use client';

import { useState, useEffect } from 'react';
import { Play, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
}

function TaskCard({ title, description, endpoint, category }: TaskCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRun = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const method = endpoint.includes('leancloud') ? 'GET' : 'POST';
      const response = await fetch(endpoint, { method });
      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        setStatus('success');
        setMessage(data.message || 'Task completed successfully');
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#e5e5e0] p-8 rounded-lg transition-shadow hover:shadow-sm">
      <div className="mb-6">
        <span className="text-xs font-medium tracking-wider uppercase text-[#6b6b6b] mb-2 block">
          {category}
        </span>
        <h2 className="text-2xl font-medium text-[#191919] mb-3 font-serif">
          {title}
        </h2>
        <p className="text-[#555555] leading-relaxed text-base">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-6 border-t border-[#f0f0ed]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleRun}
            disabled={status === 'loading'}
            className={`
              group flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
              ${status === 'loading'
                ? 'bg-[#e5e5e0] text-[#888888] cursor-not-allowed'
                : 'bg-[#191919] text-[#fdfcf8] hover:bg-[#333333] active:translate-y-0.5'
              }
            `}
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run Task
          </button>

          {/* Status Indicators */}
          {status !== 'idle' && (
            <div className={`
              flex items-center gap-2 text-sm animate-in fade-in duration-300
              ${status === 'success' ? 'text-[#3f6212]' : ''}
              ${status === 'error' ? 'text-[#9f3e3e]' : ''}
            `}>
              {status === 'success' && <Check className="w-4 h-4" />}
              {status === 'error' && <AlertCircle className="w-4 h-4" />}
            </div>
          )}
        </div>

        {message && status !== 'idle' && (
          <p className={`mt-3 text-sm ${status === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [systemStatus, setSystemStatus] = useState<'Operational' | 'Degraded' | 'Checking'>('Checking');
  const [version, setVersion] = useState('v0.2.0');

  useEffect(() => {
    // Fetch System Health
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setSystemStatus(data.status || 'Unknown');
      } catch (e) {
        setSystemStatus('Degraded');
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="min-h-screen py-24 px-6 sm:px-12 bg-[#fdfcf8]">
      <div className="max-w-3xl mx-auto">

        {/* Header Section */}
        <header className="mb-24">
          <h1 className="text-4xl sm:text-5xl font-medium text-[#191919] mb-6 font-serif tracking-tight leading-tight">
            System Operations
          </h1>
          <p className="text-lg text-[#555555] max-w-xl leading-relaxed font-light">
            Control center for automated maintenance protocols and cross-service data synchronization.
          </p>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-12">
          <TaskCard
            category="Database Maintenance"
            title="Supabase"
            description="Triggers the daily activity signal to prevent project suspension. Scheduled execution occurs daily at 08:00 UTC."
            endpoint="/api/manual-trigger"
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster. Scheduled execution occurs daily at 09:00 UTC."
            endpoint="/api/leancloud-keep-alive"
          />
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-[#e5e5e0] flex items-center justify-between text-xs text-[#888888] tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'Operational' ? 'bg-emerald-500' :
              systemStatus === 'Checking' ? 'bg-gray-400 animate-pulse' : 'bg-amber-500'
              }`}></span>
            <p>Status: {systemStatus}</p>
          </div>
          <p>Workflow {version} • Antigravity</p>
        </footer>

      </div>
    </main>
  );
}

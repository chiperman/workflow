'use client';

import { useState, useEffect } from 'react';
import { Play, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
}

function TaskCard({ title, description, endpoint, category, method }: TaskCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<{ auto_count: number; manual_count: number }>({ auto_count: 0, manual_count: 0 });

  const fetchStats = async () => {
    try {
      // Use the base endpoint (remove query params if any) and add mode=status
      const baseUrl = endpoint.split('?')[0];
      // For manual-trigger (Supabase), the logic is slightly different, but the route should support mode=status
      // For manual-trigger route, we might need to use the supabase-keep-alive route instead?
      // Wait, manual-trigger route does NOT support mode=status currently. 
      // Supabase TaskCard endpoint is /api/manual-trigger.
      // But stats are in /api/supabase-keep-alive.
      // I need to adjust this.

      let statsEndpoint = baseUrl;
      if (category === 'Database Maintenance') {
        statsEndpoint = '/api/supabase-keep-alive';
      }

      const res = await fetch(`${statsEndpoint}?mode=status`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRun = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, { method });
      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        setStatus('success');
        setMessage(data.message || 'Task completed successfully');
        fetchStats(); // Refresh stats after success
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
    <div className="flex flex-col h-full bg-white border border-[#e5e5e0] p-6 rounded-lg transition-shadow hover:shadow-sm">
      <div className="mb-4">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#6b6b6b] mb-1.5 block">
          {category}
        </span>
        <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">
          {title}
        </h2>
        <p className="text-[#555555] leading-relaxed text-sm">
          {description}
        </p>

        {/* Stats Display */}
        <div className="flex gap-4 mt-4 text-xs font-mono text-[#888888] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Auto: {stats.auto_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Manual: {stats.manual_count}</span>
          </div>
        </div>
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
          <p className={`mt-3 text-sm font-mono ${status === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'}`}>
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
    <main className="min-h-screen py-8 px-6 sm:px-12 bg-[#fdfcf8] flex flex-col justify-center">
      <div className="w-full max-w-3xl mx-auto">

        {/* Header Section */}
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-medium text-[#191919] mb-3 font-serif tracking-tight leading-tight">
            System Operations
          </h1>
          <p className="text-base text-[#555555] max-w-xl leading-relaxed font-light mx-auto sm:mx-0">
            Control center for automated maintenance protocols and cross-service data synchronization.
          </p>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          <TaskCard
            category="Database Maintenance"
            title="Supabase"
            description="Triggers the daily activity signal to prevent project suspension."
            endpoint="/api/manual-trigger"
            method="POST"
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster."
            endpoint="/api/leancloud-keep-alive"
            method="GET"
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-[#e5e5e0] flex flex-col md:flex-row items-center justify-between text-xs text-[#888888] tracking-widest uppercase gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${systemStatus === 'Operational' ? 'bg-emerald-500' :
                systemStatus === 'Checking' ? 'bg-gray-400 animate-pulse' : 'bg-amber-500'
                }`}></span>
              <p>Status: {systemStatus}</p>
            </div>
            <p>Workflow {version} • Antigravity</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-[10px] text-[#a0a09a]">Powered By</span>
            <div className="flex items-center gap-6">
              <a href="https://nextjs.org" target="_blank" rel="noreferrer" title="Vercel" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                {/* Invert the white Vercel logo to make it visible on the light theme always */}
                <img src="/vercel.svg" alt="Vercel" className="h-4 w-auto invert" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" title="GitHub" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src="/github.svg" alt="GitHub" className="h-5 w-auto" />
              </a>
              <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noreferrer" title="Gemini" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src="/gemini-color.svg" alt="Gemini" className="h-5 w-auto" />
              </a>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}

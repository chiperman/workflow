'use client';

import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Access key denied');
      }
    } catch (_err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcf8] text-[#191919] p-6">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-[#d97757]/3 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-[#3f6212]/3 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 w-full max-w-sm">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#e5e5e0] mb-6 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#3f6212]" />
          </div>
          <h1 className="text-4xl font-medium font-serif tracking-tight mb-3">Operations Lock</h1>
          <p className="text-sm text-[#555555] font-light leading-relaxed">
            Please enter your administrative access key to manage the maintenance protocols.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Access Key"
                className="w-full h-12 bg-white border border-[#e5e5e0] rounded-lg px-4 outline-none focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/5 transition-all duration-300 placeholder:text-zinc-300 text-sm"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={loading || !key}
                className="absolute right-1.5 top-1.5 h-9 px-3 bg-[#191919] text-white hover:bg-[#333333] disabled:bg-zinc-100 disabled:text-zinc-400 rounded-md transition-all duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-medium py-2 px-3 rounded-md text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
        </form>

        <footer className="mt-20 text-center">
          <p className="text-[#888888] text-[10px] uppercase tracking-widest font-medium">
            Secured Infrastructure &copy; 2026
          </p>
        </footer>
      </main>
    </div>
  );
}

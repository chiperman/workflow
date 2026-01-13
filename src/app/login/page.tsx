'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExiting, setIsExiting] = useState(false);
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
        setIsExiting(true);
        // 等待离场动画完成再跳转
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      } else {
        setError(data.message || 'Access key denied');
      }
    } catch (_err) {
      setError('Connection failed. Please try again.');
    } finally {
      if (!isExiting) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcf8] text-[#191919] p-6 overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[5%] left-[5%] w-[50%] h-[50%] bg-[#d97757] blur-[140px] rounded-full mix-blend-multiply"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.02, 0.05, 0.02],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[5%] right-[5%] w-[60%] h-[60%] bg-[#3f6212] blur-[160px] rounded-full mix-blend-multiply"
        />
      </div>

      <AnimatePresence>
        {!isExiting && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-sm"
          >
            <div className="mb-12 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#e5e5e0] mb-6 shadow-sm"
              >
                <ShieldCheck className="w-5 h-5 text-[#3f6212]" />
              </motion.div>
              <h1 className="text-4xl font-medium font-serif tracking-tight mb-3">
                Operations Lock
              </h1>
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
                    className="w-full h-12 bg-white border border-[#e5e5e0] rounded-lg px-4 outline-none focus:border-[#d97757] focus:ring-4 focus:ring-[#d97757]/5 transition-all duration-300 placeholder:text-zinc-300 text-sm disabled:opacity-50"
                    autoFocus
                    required
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !key}
                    className="absolute right-1.5 top-1.5 h-9 px-3 bg-[#191919] text-white hover:bg-[#333333] disabled:bg-zinc-100 disabled:text-zinc-400 rounded-md transition-all duration-300 flex items-center justify-center outline-none focus:ring-2 focus:ring-[#d97757]"
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
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-medium py-2 px-3 rounded-md text-center"
                >
                  {error}
                </motion.div>
              )}
            </form>

            <footer className="mt-20 text-center">
              <p className="text-[#888888] text-[10px] uppercase tracking-widest font-medium">
                Secured Infrastructure &copy; 2026
              </p>
            </footer>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

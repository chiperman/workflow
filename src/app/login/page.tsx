'use client';

import { MOTION_CONFIG } from '@/config/constants';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, Eye, EyeOff, Loader2, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const MotionButton = motion(Button);

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        window.location.replace('/');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-foreground p-6 overflow-hidden relative">
      <AnimatePresence>
        {!isExiting && (
          <>
            {/* Back Button */}
            <MotionButton
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="absolute top-8 left-8 text-[10px] font-medium tracking-tight text-text-secondary hover:text-foreground hover:border-accent-primary/30 transition-colors duration-300 shadow-sm sm:shadow-none"
              title="Back to home"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </MotionButton>

            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: MOTION_CONFIG.duration, ease: MOTION_CONFIG.ease }}
              className="relative z-10 w-full max-w-sm"
            >
              <div className="mb-12 text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: MOTION_CONFIG.ease }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-border-custom mb-6 shadow-sm"
                >
                  <Workflow className="w-5 h-5 text-accent-primary" strokeWidth={1.5} />
                </motion.div>
                <h1 className="text-4xl font-medium font-serif tracking-tight mb-3">
                  Operations Lock
                </h1>
                <p className="text-sm text-text-tertiary font-light leading-relaxed">
                  Please enter your administrative access key to manage the maintenance protocols.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative group">
                    <label htmlFor="access-key" className="sr-only">
                      Access Key
                    </label>
                    <input
                      id="access-key"
                      type={showPassword ? 'text' : 'password'}
                      value={key}
                      onChange={e => setKey(e.target.value)}
                      placeholder="Access Key"
                      className="w-full h-12 bg-white border border-border-custom rounded-lg pl-4 pr-24 outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition-all duration-300 placeholder:text-zinc-300 text-sm disabled:opacity-50"
                      autoFocus
                      required
                      disabled={loading}
                      aria-describedby={error ? 'login-error' : undefined}
                      aria-invalid={error ? 'true' : undefined}
                    />
                    <div className="absolute right-1.5 top-1.5 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading || !key}
                        className="h-9 w-9 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        type="submit"
                        variant="brand"
                        size="icon"
                        disabled={loading || !key}
                        className="h-9 w-9 shadow-sm shadow-[#d97757]/20"
                        aria-label="Submit login"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    id="login-error"
                    role="alert"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-medium py-2 px-3 rounded-md text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </form>

              <footer className="mt-20 text-center">
                <p className="text-text-secondary text-[10px] uppercase tracking-widest font-medium">
                  Secured Infrastructure &copy; 2026
                </p>
              </footer>
            </motion.main>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

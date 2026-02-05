import { useState, useEffect } from 'react';
import { useAuth, getApiUrl } from '@/lib/auth';
import { CheckCircle2, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, signInWithProvider } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // UI State
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'sending' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Detection State
  const [userStatus, setUserStatus] = useState({ exists: false, hasName: false, checked: false });
  const [debouncedEmail, setDebouncedEmail] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (showAuthModal) {
      setStep('form');
      setStatus('idle');
      setErrorMsg('');
      setEmail('');
      setName('');
      setUserStatus({ exists: false, hasName: false, checked: false });
    }
  }, [showAuthModal]);

  // Debounce email check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // Auto-detect user status
  useEffect(() => {
    const checkUser = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(debouncedEmail)) {
        setUserStatus({ exists: false, hasName: false, checked: false });
        return;
      }

      setStatus('checking');
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/auth/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: debouncedEmail }),
        });

        const data = await res.json();
        if (res.ok) {
          setUserStatus({ exists: data.exists, hasName: data.hasName, checked: true });
          if (data.exists && data.name) {
            setName(data.name);
          }
        }
        setStatus('idle');
      } catch (err) {
        console.error('Check failed:', err);
        setStatus('idle');
      }
    };

    if (debouncedEmail) {
      checkUser();
    }
  }, [debouncedEmail]);

  // Auto-close after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => closeAuthModal(), 8000);
      return () => clearTimeout(timer);
    }
  }, [step, closeAuthModal]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setStep('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const showNameField = userStatus.checked && !userStatus.hasName;
  const isRecognized = userStatus.checked && userStatus.exists && userStatus.hasName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeAuthModal}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="comic-panel bg-white p-6 sm:p-8 max-w-md w-full comic-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="comic-title text-2xl mb-3 text-black">
                {userStatus.exists ? 'WELCOME BACK!' : 'CHECK YOUR EMAIL!'}
              </h2>
              <p className="comic-body text-gray-700">
                Magic link sent to <span className="font-bold">{email}</span>.
              </p>
              <button
                onClick={closeAuthModal}
                className="mt-6 px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
              >
                GOT IT
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0 }}>
              <h2 className="comic-title text-2xl mb-1 text-black text-center">
                {isRecognized ? `WELCOME BACK, ${name.split(' ')[0].toUpperCase()}!` : 'JOIN THE REVOLUTION'}
              </h2>
              <p className="comic-body text-gray-500 text-sm mb-6 text-center">
                {isRecognized ? "Good to see you again. Let's get you in." : "Vote on ideas. Earn badges. Build the future."}
              </p>

              <button
                type="button"
                onClick={() => signInWithProvider('google')}
                className="w-full px-6 py-4 bg-white border-3 border-black comic-title text-base hover:bg-gray-50 transition-all comic-shadow flex items-center justify-center gap-3 mb-6 text-black"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                CONTINUE WITH GOOGLE
              </button>

              <button
                type="button"
                onClick={() => signInWithProvider('github')}
                className="w-full px-6 py-4 bg-[#24292F] border-3 border-black text-white hover:bg-[#1f2328] transition-all comic-shadow flex items-center justify-center gap-3 mb-6"
                aria-label="Continue with GitHub"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="comic-title text-base">CONTINUE WITH GITHUB</span>
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 border-t-2 border-gray-200"></div>
                <span className="comic-body text-xs text-gray-400 font-bold uppercase">or use email</span>
                <div className="flex-1 border-t-2 border-gray-200"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-3 border-3 comic-body focus:outline-none transition-all duration-300 ${isRecognized ? 'border-green-500 bg-green-50' : 'border-black focus:ring-4 focus:ring-yellow-400'
                      }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {status === 'checking' && <div className="animate-spin text-gray-400 text-xs">⚡</div>}
                    {isRecognized && <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />}
                  </div>
                </div>

                <AnimatePresence>
                  {showNameField && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="comic-body text-xs text-rose-700 font-bold mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> NICE TO MEET YOU! WHAT SHOULD WE CALL YOU?
                      </p>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name (Required)"
                        className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                        required
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {errorMsg && (
                  <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending' || (userStatus.checked && !userStatus.hasName && !name)}
                  className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? 'SENDING...' : (
                    <>
                      {isRecognized ? 'SIGN IN' : 'CONTINUE'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

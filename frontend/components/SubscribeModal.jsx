import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';
import { Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscribeModal() {
  const router = useRouter();
  const { subscribeNewsletter, showSubscribeModal, closeSubscribeModal, openAuthModal } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (showSubscribeModal) {
      setEmail('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [showSubscribeModal]);

  // Auto-close after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => closeSubscribeModal(), 4000);
      return () => clearTimeout(timer);
    }
  }, [status, closeSubscribeModal]);

  // Close modal on route change (page navigation)
  useEffect(() => {
    const handleRouteChange = () => {
      closeSubscribeModal();
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, closeSubscribeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || status === 'loading') {
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await subscribeNewsletter(email);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Subscription failed');
      setStatus('error');
    }
  };

  if (!showSubscribeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeSubscribeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="comic-panel bg-white p-6 sm:p-8 max-w-md w-full comic-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="comic-title text-2xl mb-3 text-black">YOU&apos;RE IN!</h2>
              <p className="comic-body text-gray-700">
                Check your email for a confirmation. First newsletter drops Monday.
              </p>
              <button
                onClick={closeSubscribeModal}
                className="mt-6 px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
              >
                GOT IT
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <h2 className="comic-title text-2xl mb-2 text-black flex items-center gap-2">
                  <Mail className="w-6 h-6 text-rose-700" />
                  GET THE WEEKLY ZEROS
                </h2>
                <p className="comic-body text-gray-600 text-sm">
                  10 validated startup ideas delivered every Monday. Free forever.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black bg-white"
                  required
                  autoFocus
                />

                {status === 'error' && (
                  <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? 'SUBSCRIBING...' : (
                    <>
                      SUBSCRIBE FREE
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs comic-body text-gray-600 text-center">
                ✓ 100% Free &bull; ✓ Unsubscribe anytime &bull; ✓ No spam
              </p>

              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
                <p className="text-sm comic-body text-gray-600">
                  Want to vote &amp; earn badges?
                </p>
                <button
                  onClick={() => {
                    closeSubscribeModal();
                    openAuthModal();
                  }}
                  className="mt-2 text-rose-700 font-bold comic-body hover:text-rose-900 inline-flex items-center gap-1 underline"
                >
                  Create an account <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

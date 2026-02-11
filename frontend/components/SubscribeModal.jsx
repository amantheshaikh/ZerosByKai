import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';
import { ArrowRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SubscribeModal() {
    const router = useRouter();
    const { showSubscribeModal, closeSubscribeModal, subscribeNewsletter, openAuthModal, user } = useAuth();

    // Form State
    const [email, setEmail] = useState('');
    // UI State
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (showSubscribeModal) {
            setStep('form');
            setStatus('idle');
            setErrorMsg('');
            if (user?.email) {
                setEmail(user.email);
            } else {
                setEmail('');
            }
        }
    }, [showSubscribeModal]);

    // Auto-close after success
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => closeSubscribeModal(), 8000);
            return () => clearTimeout(timer);
        }
    }, [step, closeSubscribeModal]);

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

    if (!showSubscribeModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!EMAIL_REGEX.test(email) || status === 'sending') {
            return;
        }

        setStatus('sending');
        setErrorMsg('');

        try {
            await subscribeNewsletter(email);
            setStep('success');
        } catch (err) {
            setErrorMsg(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={closeSubscribeModal}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
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
                            <div className="text-5xl mb-4">✨</div>
                            <h2 className="comic-title text-2xl mb-3 text-black">
                                YOU'RE ON THE LIST!
                            </h2>
                            <p className="comic-body text-gray-700">
                                Thanks for subscribing. Expect curated chaos in your inbox every Monday.
                            </p>
                            <button
                                onClick={closeSubscribeModal}
                                className="mt-6 px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
                            >
                                AWESOME
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="form" exit={{ opacity: 0 }}>
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <Mail className="w-8 h-8 text-black" />
                            </div>
                            <h2 className="comic-title text-2xl mb-1 text-black text-center">
                                GET THE WEEKLY DROP
                            </h2>
                            <p className="comic-body text-gray-500 text-sm mb-6 text-center">
                                10 validated startup ideas. Once a week. No fluff.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {errorMsg && (
                                    <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'sending' || !EMAIL_REGEX.test(email)}
                                    className="w-full px-6 py-4 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-all comic-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {status === 'sending' ? 'ADDING YOU...' : (
                                        <>
                                            SUBSCRIBE FREE
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
                                <p className="text-xs comic-body text-gray-500">
                                    Want to vote &amp; earn badges?
                                </p>
                                <button
                                    onClick={() => {
                                        closeSubscribeModal();
                                        openAuthModal('signin');
                                    }}
                                    className="mt-1 text-black font-bold comic-body hover:text-rose-700 inline-flex items-center gap-1 underline text-sm"
                                >
                                    Create an account <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

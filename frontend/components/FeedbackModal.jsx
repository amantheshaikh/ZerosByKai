import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import { useRouter } from 'next/router';
import { MessageSquare, Send, X, Heart, Bomb, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackModal() {
    const router = useRouter();
    const { showFeedbackModal, closeFeedbackModal, user } = useAuth();

    // Form State
    const [type, setType] = useState('love'); // 'love' | 'hate' | 'idea' | 'bug'
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(user?.email || '');

    // UI State
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (showFeedbackModal) {
            setStep('form');
            setStatus('idle');
            setErrorMsg('');
            setMessage('');
            if (user?.email) setEmail(user.email);
        }
    }, [showFeedbackModal, user]);

    // Close modal on route change
    useEffect(() => {
        const handleRouteChange = () => closeFeedbackModal();
        router.events.on('routeChangeStart', handleRouteChange);
        return () => router.events.off('routeChangeStart', handleRouteChange);
    }, [router, closeFeedbackModal]);

    if (!showFeedbackModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || status === 'sending') return;

        // Simple email validation if email is provided
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErrorMsg('That email looks fake. Kai demands better data.');
            return;
        }

        setStatus('sending');
        setErrorMsg('');

        try {
            await apiFetch('/api/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    message: message.trim(),
                    email: email.trim() || null,
                    path: router.asPath
                }),
            });

            setStep('success');
            // Auto-close after success
            autoCloseTimeoutRef.current = setTimeout(() => closeFeedbackModal(), 5000);
        } catch (err) {
            setErrorMsg(err.message || 'The terminal exploded. Try again?');
            setStatus('error');
        }
    };

    const feedbackTypes = [
        { id: 'love', label: 'PURE LOVE', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
        { id: 'idea', label: 'BRAIN BLAST', icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        { id: 'bug', label: 'GLITCH IN MATRIX', icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'hate', label: 'ROAST KAI', icon: Bomb, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeFeedbackModal}>
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="comic-panel bg-white p-5 sm:p-7 max-w-lg w-full comic-shadow relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={closeFeedbackModal}
                    className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-black" />
                </button>

                <AnimatePresence mode="wait">
                    {step === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6 sm:py-10"
                        >
                            <div className="text-5xl mb-4">🤟</div>
                            <h2 className="comic-title text-2xl sm:text-3xl mb-3 text-black uppercase">
                                RECEIVED.
                            </h2>
                            <p className="comic-body text-sm sm:text-base text-gray-700 max-w-xs mx-auto">
                                Kai has analyzed your data. He may or may not agree with your perspective.
                                <br /><br />
                                <span className="font-bold text-rose-700 uppercase">Stay Sharp.</span>
                            </p>
                            <button
                                onClick={closeFeedbackModal}
                                className="mt-6 sm:mt-8 px-6 py-2.5 bg-black text-yellow-400 comic-title text-base hover:bg-gray-900 transition-colors comic-shadow"
                            >
                                BACK TO RESEARCH
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="form" exit={{ opacity: 0 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-yellow-400 p-1.5 border-2 border-black rotate-3">
                                    <MessageSquare className="w-5 h-5 text-black" />
                                </div>
                                <h2 className="comic-title text-2xl text-black">FEEDBACK LOOP</h2>
                            </div>

                            <div className="comic-panel p-3 bg-black text-yellow-400 mb-6 transform -rotate-1">
                                <p className="comic-body text-xs font-bold italic leading-snug">
                                    &quot;I&apos;m the best, but I&apos;m still learning.
                                    Drop your thoughts—if they&apos;re good, I might listen.&quot;
                                </p>
                                <p className="text-right text-[10px] mt-1 opacity-80">— Kai</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                                <div>
                                    <label className="comic-title text-[10px] sm:text-xs block mb-2 text-gray-900">WHAT&apos;S THE VIBE?</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {feedbackTypes.map((ft) => (
                                            <button
                                                key={ft.id}
                                                type="button"
                                                onClick={() => setType(ft.id)}
                                                className={`p-2 sm:p-3 border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${type === ft.id
                                                    ? `border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1`
                                                    : `border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black`
                                                    }`}
                                            >
                                                <ft.icon className={`w-5 h-5 ${type === ft.id ? 'text-white' : ft.color}`} />
                                                <span className="text-[8px] sm:text-[10px] font-bold comic-title leading-none">{ft.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="comic-title text-[10px] sm:text-xs block mb-2 text-gray-900">UNLEASH THE DATA</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={
                                            type === 'love' ? "Tell Kai what worked..." :
                                                type === 'hate' ? "What's broken? Don't hold back." :
                                                    type === 'idea' ? "A feature I missed?" :
                                                        "Describe the glitch..."
                                        }
                                        className="w-full px-3 py-2 border-3 border-black comic-body text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 h-24 sm:h-28 resize-none"
                                        required
                                    />
                                </div>

                                {!user && (
                                    <div>
                                        <label className="comic-title text-[10px] sm:text-xs block mb-2 text-gray-900">WHO ARE YOU? (OPTIONAL)</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full px-3 py-2 border-3 border-black comic-body text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400"
                                        />
                                    </div>
                                )}

                                {errorMsg && (
                                    <div className="bg-rose-50 border-2 border-rose-400 p-2 sm:p-3 text-rose-700 comic-body text-xs sm:text-sm font-bold">
                                        ⚠️ {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'sending' || !message.trim()}
                                    className="w-full px-5 py-3 sm:py-4 bg-rose-700 text-white comic-title text-lg sm:text-xl hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    {status === 'sending' ? 'UPLOADING...' : (
                                        <>
                                            TRANSMIT FEEDBACK
                                            <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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

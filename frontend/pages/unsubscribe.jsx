import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

const REASONS = [
    "I'm not building a startup right now",
    "Too many emails in my inbox",
    "The ideas aren't relevant to me",
    "I found a co-founder/idea already",
    "I prefer to find ideas myself",
    "Other"
];

export default function Unsubscribe() {
    const router = useRouter();
    const { email, token } = router.query;

    // States: 'loading' | 'confirm' | 'survey' | 'success' | 'error' | 'already_unsubscribed'
    const [status, setStatus] = useState('loading');
    const [selectedReason, setSelectedReason] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;

        if (!email || !token) {
            setStatus('error');
            return;
        }

        // Verify token first without unsubscribing
        const verifyToken = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/auth/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed');

                if (data.isUnsubscribed) {
                    setStatus('already_unsubscribed');
                } else {
                    setStatus('confirm');
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };

        verifyToken();
    }, [router.isReady, email, token]);

    const handleUnsubscribe = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/auth/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    token,
                    reason: selectedReason
                })
            });

            if (!res.ok) throw new Error('Failed to unsubscribe');
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStay = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            </div>

            <Head>
                <title>Unsubscribe from Startup Ideas Newsletter | Zeros By Kai</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <AnimatePresence mode='wait'>
                <motion.div
                    key={status}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-xl w-full"
                >
                    {/* LOADING STATE */}
                    {status === 'loading' && (
                        <div className="text-center">
                            <div className="animate-bounce text-6xl mb-4">📨</div>
                            <p className="comic-title text-xl text-black">CHECKING POSTAL SERVICE...</p>
                        </div>
                    )}

                    {/* CONFIRMATION STATE */}
                    {status === 'confirm' && (
                        <div className="comic-panel bg-white p-8 sm:p-10 comic-shadow relative text-center">
                            <div className="flex justify-center mb-6">
                                <div className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                    {/* Comic Panel Card */}
                                    <div className="comic-panel comic-shadow p-2 bg-gradient-to-br from-yellow-200 to-yellow-100 relative">
                                        {/* Sad Kai Badge */}
                                        <div className="absolute -top-3 -left-3 z-20 transform -rotate-6">
                                            <div className="px-3 py-1 comic-shadow border-2 border-yellow-400 bg-black">
                                                <span className="comic-title text-xs text-yellow-400">😢 SAD KAI</span>
                                            </div>
                                        </div>

                                        {/* Image Container */}
                                        <div className="relative w-48 h-56 sm:w-56 sm:h-64">
                                            <Image
                                                src="/unsubscribe-kai.png"
                                                alt="Sad Kai - We'll miss you"
                                                fill
                                                className="object-contain border-2 sm:border-3 border-black"
                                                priority
                                            />
                                        </div>

                                        {/* Bottom Badge */}
                                        <div className="absolute -bottom-3 -right-3 z-20 transform rotate-3">
                                            <div className="px-2 py-1 comic-shadow border-2 border-black bg-rose-600">
                                                <span className="comic-title text-[10px] text-white">💔 DON'T GO!</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h1 className="comic-title text-3xl sm:text-4xl mb-4 text-black">
                                WAIT! ARE YOU SURE?
                            </h1>

                            <p className="comic-body text-gray-700 text-lg mb-8 max-w-md mx-auto">
                                If you leave, you might miss the <span className="font-bold bg-yellow-200 px-1">next unicorn opportunity</span> we verify next week.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleStay}
                                    className="px-8 py-3 bg-yellow-400 border-2 border-black font-bold comic-title text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    NO, I WANT TO STAY!
                                </button>
                                <button
                                    onClick={() => setStatus('survey')}
                                    className="px-6 py-3 bg-transparent text-gray-500 font-bold comic-body text-sm hover:text-black hover:underline transition-colors"
                                >
                                    Yes, unsubscribe me &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SURVEY STATE */}
                    {status === 'survey' && (
                        <div className="comic-panel bg-white p-8 comic-shadow">
                            <h2 className="comic-title text-2xl mb-2 text-black">ONE LAST THING...</h2>
                            <p className="comic-body text-gray-600 mb-6">
                                Help us improve. Why are you breaking up with us?
                            </p>

                            <div className="space-y-3 mb-8">
                                {REASONS.map((reason) => (
                                    <label
                                        key={reason}
                                        className={`flex items-center p-3 border-2 cursor-pointer transition-all ${selectedReason === reason
                                            ? 'border-black bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -translate-y-1'
                                            : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="w-4 h-4 text-black focus:ring-black border-gray-300 mr-3"
                                        />
                                        <span className="comic-body text-sm font-bold">{reason}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setStatus('confirm')}
                                    className="text-gray-500 font-bold text-sm hover:text-black"
                                >
                                    &larr; Back
                                </button>
                                <button
                                    onClick={handleUnsubscribe}
                                    disabled={!selectedReason || isSubmitting}
                                    className={`px-6 py-2 border-2 border-black font-bold comic-title text-white bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all ${!selectedReason ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-600 hover:border-rose-800'
                                        }`}
                                >
                                    {isSubmitting ? 'PROCESSING...' : 'CONFIRM UNSUBSCRIBE'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {status === 'success' && (
                        <div className="comic-panel bg-white p-8 comic-shadow text-center">
                            <div className="inline-block p-4 rounded-full bg-green-100 border-2 border-black mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h1 className="comic-title text-3xl mb-4 text-black">UNSUBSCRIBED</h1>
                            <p className="comic-body text-gray-700 mb-8">
                                You&apos;ve been removed from the list. We&apos;ll miss you.<br />
                                If you change your mind, we&apos;ll be here digging for gold.
                            </p>
                            <Link href="/" className="inline-block bg-black text-yellow-400 px-8 py-3 comic-title text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] hover:bg-gray-900 transition-all hover:translate-y-1 hover:shadow-none">
                                RETURN HOME
                            </Link>
                        </div>
                    )}

                    {/* ALREADY UNSUBSCRIBED STATE */}
                    {status === 'already_unsubscribed' && (
                        <div className="comic-panel bg-white p-8 comic-shadow text-center">
                            <div className="inline-block p-4 rounded-full bg-blue-100 border-2 border-black mb-6">
                                <AlertTriangle className="w-12 h-12 text-blue-600" />
                            </div>
                            <h1 className="comic-title text-3xl mb-4 text-black">ALREADY DONE</h1>
                            <p className="comic-body text-gray-700 mb-8">
                                Looks like you&apos;re already unsubscribed from our list.<br />
                                No action needed on your part!
                            </p>
                            <Link href="/" className="inline-block bg-black text-yellow-400 px-8 py-3 comic-title text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] hover:bg-gray-900 transition-all hover:translate-y-1 hover:shadow-none">
                                RETURN HOME
                            </Link>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                        <div className="comic-panel bg-white p-8 comic-shadow text-center">
                            <div className="inline-block p-4 rounded-full bg-red-100 border-2 border-black mb-6">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h1 className="comic-title text-3xl mb-4 text-black">OOPS!</h1>
                            <p className="comic-body text-gray-700 mb-8">
                                Something went wrong. The link might be invalid or expired.<br />
                                Please try clicking the link in your email again.
                            </p>
                            <Link href="/" className="flex items-center justify-center gap-2 comic-body font-bold hover:underline text-black">
                                <ArrowLeft className="w-4 h-4" /> Go back home
                            </Link>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

Unsubscribe.headerVariant = 'none';

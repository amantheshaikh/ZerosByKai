import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const AuthCallback = () => {
    const router = useRouter();
    const { supabase, openAuthModal } = useAuth();
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 15s timeout
    useEffect(() => {
        const timer = setTimeout(() => setError(true), 15000);
        return () => clearTimeout(timer);
    }, []);

    // Check for error params in URL hash
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash.includes('error_description')) {
                const params = new URLSearchParams(hash.replace('#', ''));
                setErrorMessage(params.get('error_description') || 'Authentication failed');
                setError(true);
            }
        }
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Head>
                    <title>Authentication Error | ZerosByKai</title>
                    <meta name="robots" content="noindex, nofollow" />
                </Head>
                <div className="comic-panel bg-white p-8 max-w-md w-full mx-4 comic-shadow text-center">
                    <div className="text-5xl mb-4">&#9888;</div>
                    <h1 className="comic-title text-3xl mb-3 text-black">SOMETHING WENT WRONG</h1>
                    <p className="comic-body text-gray-700 mb-6">
                        {errorMessage || 'The magic link may have expired or was already used.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => openAuthModal('signin')}
                            className="px-5 py-2 bg-rose-700 text-white border-2 border-black comic-title text-sm hover:bg-rose-800 transition-colors"
                        >
                            TRY AGAIN
                        </button>
                        <Link
                            href="/"
                            className="px-5 py-2 bg-black text-yellow-400 border-2 border-black comic-title text-sm hover:bg-gray-900 transition-colors"
                        >
                            GO HOME
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Head>
                <title>Signing In... | ZerosByKai</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div className="text-center">
                <div className="animate-spin text-4xl mb-4">&#9889;</div>
                <h1 className="comic-title text-3xl">VERIFYING YOUR ZERO...</h1>
            </div>
        </div>
    );
};

export default AuthCallback;

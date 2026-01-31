import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { getApiUrl } from '@/lib/auth';

export default function Unsubscribe() {
    const router = useRouter();
    const { email, token } = router.query;
    const [status, setStatus] = useState('loading'); // loading, success, error

    useEffect(() => {
        if (!router.isReady) return;

        if (!email) {
            setStatus('error');
            return;
        }

        const unsubscribe = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/auth/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`);
                if (!res.ok) throw new Error('Failed');
                setStatus('success');
            } catch (err) {
                setStatus('error');
            }
        };

        unsubscribe();
    }, [router.isReady, email, token]);

    return (
        <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
            <Head>
                <title>Unsubscribe | ZerosByKai</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="max-w-md w-full comic-panel bg-white p-8 comic-shadow text-center">
                {status === 'loading' && (
                    <div className="py-12">
                        <div className="animate-spin text-4xl mb-4">&#9889;</div>
                        <p className="mt-4 comic-title text-xl text-black">PROCESSING...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="comic-title text-2xl mb-2 text-black">UNSUBSCRIBED</h1>
                        <p className="comic-body text-gray-600 mb-6">
                            You won&apos;t receive any more weekly digests or updates.
                        </p>
                        <Link href="/" className="inline-block bg-black text-yellow-400 px-6 py-2 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow">
                            RETURN HOME
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="comic-title text-2xl mb-2 text-black">OOPS!</h1>
                        <p className="comic-body text-gray-600 mb-6">
                            Something went wrong. You might already be unsubscribed or the link is invalid.
                        </p>
                        <Link href="/" className="flex items-center justify-center gap-2 comic-body font-bold hover:underline text-black">
                            <ArrowLeft className="w-4 h-4" /> Go back
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

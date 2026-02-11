import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function ViewEmail() {
    const router = useRouter();
    const { type, id } = router.query;
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!router.isReady || !type) return;

        const fetchEmail = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const url = id
                    ? `${backendUrl}/api/emails/view/${type}/${id}`
                    : `${backendUrl}/api/emails/view/${type}`;

                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error('Failed to load email content');
                }

                const html = await res.text();
                setHtmlContent(html);
            } catch (err) {
                console.error('Error fetching email:', err);
                setError('Unable to load this email. It may have expired or does not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmail();
    }, [router.isReady, type, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-center">
                <h1 className="text-xl font-bold mb-2">Oops!</h1>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>View Curated Startup Idea Email | Zeros By Kai</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="w-full min-h-screen bg-white"
            />
        </>
    );
}

ViewEmail.headerVariant = 'none';

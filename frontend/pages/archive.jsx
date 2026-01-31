import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Award } from 'lucide-react';
import { getApiUrl } from '@/lib/auth';
import Header from '@/components/Header';

export default function ArchivePage() {
    const [batches, setBatches] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = `${getApiUrl()}/api/ideas/weekly-batches`;
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                setBatches(data.batches || []);
            })
            .catch(() => setBatches([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-yellow-50">
            <Head>
                <title>Startup Ideas Archive — Past Weekly Winners | ZerosByKai</title>
                <meta name="description" content="Browse past weeks of validated startup ideas and winning business opportunities from ZerosByKai. See which startup ideas won the community vote each week." />
                <meta name="keywords" content="startup ideas archive, past business ideas, winning startup ideas, validated business opportunities, weekly startup winners" />
                <meta property="og:title" content="Startup Ideas Archive | ZerosByKai" />
                <meta property="og:description" content="Browse past weeks of validated startup ideas and winning business opportunities curated from Reddit." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/archive" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="Startup Ideas Archive | ZerosByKai" />
                <meta name="twitter:description" content="Browse past weeks of validated startup ideas and winning business opportunities." />
                <link rel="canonical" href="https://zerosbykai.com/archive" />
            </Head>
            <Header variant="page" />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="comic-title text-5xl text-gray-900 mb-2">ARCHIVE</h1>
                    <p className="comic-body text-gray-600 text-lg">Past weekly winners and their winning ideas.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin text-4xl mb-4">⚡</div>
                            <p className="comic-title text-2xl text-gray-900">LOADING ARCHIVE...</p>
                        </div>
                    </div>
                ) : batches && batches.length > 0 ? (
                    <div className="space-y-8">
                        {batches.map((batch) => {
                            const winner = batch.winner;
                            const weekDate = new Date(batch.week_start_date);
                            const weekLabel = weekDate.toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            });

                            return (
                                <div key={batch.id} className="comic-panel bg-white p-8 comic-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Award className="w-8 h-8 text-yellow-500" />
                                        <div>
                                            <h2 className="comic-title text-2xl text-gray-900">WEEK OF {weekLabel.toUpperCase()}</h2>
                                            {batch.total_votes && (
                                                <p className="comic-body text-xs text-gray-500">{batch.total_votes} total votes</p>
                                            )}
                                        </div>
                                    </div>

                                    {winner ? (
                                        <div className="border-2 border-black p-6 bg-yellow-50">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {(winner.tags?.region || winner.tag) && (
                                                    <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 border border-black">
                                                        {winner.tags?.region || winner.tag}
                                                    </span>
                                                )}
                                                {(winner.tags?.category || winner.category) && (
                                                    <span className="px-2 py-0.5 text-xs font-bold bg-purple-50 border border-black">
                                                        {winner.tags?.category || winner.category}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="comic-title text-2xl mb-1 text-black">{winner.name}</h3>
                                            <p className="comic-body font-bold text-gray-600 text-sm mb-3">{winner.title}</p>
                                            <p className="comic-body text-sm text-gray-800">{winner.problem}</p>
                                            {batch.winner_vote_count && (
                                                <div className="mt-4 inline-block bg-black text-yellow-400 px-3 py-1 comic-title text-xs">
                                                    {batch.winner_vote_count} VOTES
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                                            <p className="comic-body text-gray-500">No winner determined for this week.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="comic-panel bg-white p-12 comic-shadow text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h2 className="comic-title text-3xl mb-3 text-gray-900">NO PAST WEEKS YET</h2>
                        <p className="comic-body text-gray-600 mb-6">
                            The archive will fill up as weeks go by. Check back after the first voting round!
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors"
                        >
                            BACK TO THIS WEEK
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

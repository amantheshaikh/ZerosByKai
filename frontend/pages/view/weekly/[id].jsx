import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Award, ChevronLeft, Sparkles, Zap, Mail } from 'lucide-react';
import { fetchWeeklyBatch } from '@/lib/ideas';

export default function WeeklyDigestView() {
    const router = useRouter();
    const { id } = router.query;
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetchWeeklyBatch(id)
            .then(setBatch)
            .catch(err => {
                console.error('Failed to fetch batch:', err);
                setError('Could not load this week\'s digest. It might not exist yet.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const weekLabel = id ? new Date(id).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }) : '';

    return (
        <div className="min-h-screen bg-yellow-50">
            <Head>
                <title>Weekly Startup Ideas Digest: {weekLabel} | Zeros By Kai</title>
                <meta name="description" content={`View the curated startup ideas for the week of ${weekLabel}. 10 validated opportunities from Zeros By Kai.`} />
                <meta name="robots" content="noindex" />
            </Head>



            <div className="max-w-4xl 2xl:max-w-6xl mx-auto px-6 pt-32 pb-12">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-black mb-4 transition-colors group"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            BACK TO TODAY&apos;S IDEAS
                        </Link>
                        <h1 className="comic-title text-4xl sm:text-5xl text-gray-900 mb-2 uppercase">WEEKLY DIGEST</h1>
                        <p className="comic-body text-gray-600 text-base sm:text-lg">Curated opportunities for the week of {weekLabel}</p>
                    </div>

                    <div className="hidden sm:block">
                        <div className="comic-panel p-2 bg-black rotate-2 text-yellow-400 comic-title text-xs">
                            KAI&apos;S INTEL REPORT
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="animate-spin text-4xl mb-4 text-black">⚡</div>
                            <p className="comic-title text-2xl text-gray-900">DECRYPTING REPORT...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="comic-panel bg-white p-12 comic-shadow text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h2 className="comic-title text-3xl mb-3 text-gray-900">404 - SIGNAL LOST</h2>
                        <p className="comic-body text-gray-600 mb-6">{error}</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors"
                        >
                            BACK TO CURRENT WEEK
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Winner Section */}
                        {batch.winner && (
                            <div className="comic-panel bg-white p-6 sm:p-10 comic-shadow relative border-4 border-black">
                                <div className="absolute -top-4 -right-4 bg-yellow-400 border-3 border-black p-3 rotate-6 animate-bob z-10">
                                    <Award className="w-8 h-8 text-black" />
                                </div>

                                <div className="mb-6">
                                    <span className="bg-black text-white px-3 py-1 comic-title text-xs tracking-widest uppercase">
                                        🏆 LAST WEEK&apos;S WINNER
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {batch.winner.tagsList.map((t, idx) => (
                                        <span key={idx} className="px-2 py-0.5 text-xs font-bold border border-black bg-blue-50">
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <h2 className="comic-title text-3xl sm:text-4xl mb-2 text-black">{batch.winner.name}</h2>
                                <p className="comic-body font-bold text-gray-600 text-lg mb-6">{batch.winner.title}</p>

                                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-gray-200">
                                    <div>
                                        <span className="block text-[10px] font-black text-gray-400 mb-2 tracking-tighter uppercase italic">The Problem</span>
                                        <p className="comic-body text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 border-l-4 border-black">
                                            {batch.winner.problem}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-yellow-600 mb-2 tracking-tighter uppercase italic">The Fix</span>
                                        <p className="comic-body text-sm text-gray-700 italic bg-yellow-50 p-4 border-l-4 border-yellow-400">
                                            {batch.winner.solution}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analysis Header */}
                        <div className="bg-black text-white p-6 comic-panel transform -rotate-1">
                            <div className="flex items-center gap-4">
                                <Sparkles className="w-8 h-8 text-yellow-400" />
                                <div>
                                    <p className="comic-title text-xl">THE STASH: 10 VALIDATED OPPORTUNITIES</p>
                                    <p className="comic-body text-xs text-gray-400 uppercase tracking-widest mt-1">
                                        No AI fluff. Real problems. Real signals.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ideas List */}
                        <div className="space-y-10">
                            {batch.ideas.map((idea, idx) => (
                                <div key={idea.id} className="relative group">
                                    <div className="absolute -left-4 top-0 w-8 h-8 bg-black text-white flex items-center justify-center comic-title text-sm z-10 group-hover:bg-rose-700 transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="comic-panel bg-white p-6 sm:p-8 comic-shadow border-2 border-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {idea.tagsList.map((t, tidx) => (
                                                <span key={tidx} className="px-2 py-0.5 text-[10px] font-bold border border-black bg-gray-50">
                                                    {t}
                                                </span>
                                            ))}
                                            {batch.winner && idea.id === batch.winner.id && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-400 border border-black">
                                                    🏆 WINNER
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="comic-title text-2xl mb-1 text-black">{idea.name}</h3>
                                        <p className="comic-body text-sm text-gray-500 mb-6 italic">{idea.title}</p>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-tighter italic">The Problem</div>
                                                <p className="comic-body text-sm text-gray-800 leading-relaxed font-medium">
                                                    {idea.problem}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-yellow-600 mb-1 uppercase tracking-tighter italic">The Solution</div>
                                                <p className="comic-body text-sm text-gray-700 italic border-l-4 border-yellow-200 pl-3">
                                                    {idea.solution}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                            <Link
                                                href={`/?vote=${idea.id}#ideas-section`}
                                                className="inline-flex items-center gap-2 bg-black text-yellow-400 px-4 py-2 comic-title text-xs hover:bg-yellow-400 hover:text-black transition-colors comic-shadow-sm"
                                            >
                                                VOTE FOR THIS <Zap className="w-3 h-3 fill-current" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Final CTA */}
                        <div className="comic-panel bg-rose-700 text-white p-10 text-center comic-shadow-black border-4 border-black transform rotate-1">
                            <h3 className="comic-title text-3xl mb-4">ENOUGH READING. TIME TO JUDGE.</h3>
                            <p className="comic-body text-lg mb-8 opacity-90 italic">
                                &quot;Maybe you actually have the eye of an Angel Investor.&quot;
                            </p>
                            <Link
                                href="/"
                                className="inline-block bg-white text-rose-700 px-8 py-4 comic-title text-xl hover:bg-yellow-400 hover:text-black transition-all hover:scale-105 active:scale-95 comic-shadow shadow-white/20"
                            >
                                PROVE IT NOW &rarr;
                            </Link>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

WeeklyDigestView.headerVariant = 'page';

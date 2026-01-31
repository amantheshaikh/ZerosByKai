import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { getApiUrl } from '@/lib/auth';
import Header from '@/components/Header';

export default function ArchivePage() {
    const [batches, setBatches] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState({});

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

    const toggleWeek = (batchId) => {
        setExpandedWeeks(prev => ({
            ...prev,
            [batchId]: !prev[batchId]
        }));
    };

    return (
        <div className="min-h-screen bg-yellow-50">
            <Head>
                <title>Startup Ideas Archive — Browse All Past Ideas | ZerosByKai</title>
                <meta name="description" content="Browse the complete archive of startup ideas from ZerosByKai. See every validated business opportunity, past winners, and explore hundreds of startup ideas curated from Reddit." />
                <meta name="keywords" content="startup ideas archive, past business ideas, all startup ideas, validated business opportunities, weekly startup winners, complete archive" />
                <meta property="og:title" content="Complete Startup Ideas Archive | ZerosByKai" />
                <meta property="og:description" content="Explore the complete archive of validated startup ideas and business opportunities curated from Reddit. See winners and all past ideas." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/archive" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="Complete Startup Ideas Archive | ZerosByKai" />
                <meta name="twitter:description" content="Explore hundreds of validated startup ideas. See winners and browse the complete archive." />
                <link rel="canonical" href="https://zerosbykai.com/archive" />
            </Head>
            <Header variant="page" />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="comic-title text-5xl text-gray-900 mb-2">ARCHIVE</h1>
                    <p className="comic-body text-gray-600 text-lg">Browse all past startup ideas. See what won and explore every opportunity.</p>
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
                            const ideas = batch.ideas || [];
                            const isExpanded = expandedWeeks[batch.id];
                            const weekDate = new Date(batch.week_start_date);
                            const weekLabel = weekDate.toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            });

                            return (
                                <div key={batch.id} className="comic-panel bg-white p-8 comic-shadow">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Award className="w-8 h-8 text-yellow-500" />
                                        <div className="flex-1">
                                            <h2 className="comic-title text-2xl text-gray-900">WEEK OF {weekLabel.toUpperCase()}</h2>
                                            <p className="comic-body text-xs text-gray-500">
                                                {ideas.length} ideas • {batch.total_votes || 0} total votes
                                            </p>
                                        </div>
                                    </div>

                                    {/* Winner */}
                                    {winner ? (
                                        <div className="border-2 border-black p-6 bg-yellow-50 mb-6 relative">
                                            <div className="absolute -top-3 -left-3 bg-yellow-400 border-2 border-black px-3 py-1 comic-title text-xs shadow-md">
                                                🏆 WINNER
                                            </div>
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
                                            <p className="comic-body text-sm text-gray-800 mb-3">{winner.problem}</p>
                                            <p className="comic-body text-sm text-gray-700 italic">{winner.solution}</p>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 p-6 text-center mb-6">
                                            <p className="comic-body text-gray-500">No winner determined for this week.</p>
                                        </div>
                                    )}

                                    {/* All Ideas Toggle */}
                                    {ideas.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => toggleWeek(batch.id)}
                                                className="w-full flex items-center justify-between p-4 border-2 border-black bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <span className="comic-title text-sm">
                                                    {isExpanded ? 'HIDE' : 'SHOW'} ALL {ideas.length} IDEAS FROM THIS WEEK
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-4 space-y-4 border-2 border-gray-200 p-4">
                                                    {ideas.map((idea, idx) => {
                                                        const isWinner = winner && idea.id === winner.id;
                                                        return (
                                                            <div
                                                                key={idea.id}
                                                                className={`p-4 border-2 ${
                                                                    isWinner
                                                                        ? 'border-yellow-400 bg-yellow-50'
                                                                        : 'border-gray-300 bg-white'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-black text-yellow-400 flex items-center justify-center comic-title text-sm">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                                            {idea.tags?.region && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 border border-black">
                                                                                    {idea.tags.region}
                                                                                </span>
                                                                            )}
                                                                            {idea.tags?.category && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 border border-black">
                                                                                    {idea.tags.category}
                                                                                </span>
                                                                            )}
                                                                            {isWinner && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-400 border border-black">
                                                                                    🏆 WINNER
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="comic-title text-lg mb-1">{idea.name}</h4>
                                                                        <p className="comic-body text-xs text-gray-600 mb-2">{idea.title}</p>
                                                                        <p className="comic-body text-sm text-gray-800">{idea.problem}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
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

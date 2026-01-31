import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth, apiFetch } from '@/lib/auth';
import Header from '@/components/Header';

const TIERS = [
    { key: 'none', label: 'No Tier', emoji: '—', min: 0, next: 1 },
    { key: 'bronze', label: 'Bronze', emoji: '🥉', min: 1, next: 3 },
    { key: 'silver', label: 'Silver', emoji: '🥈', min: 3, next: 6 },
    { key: 'gold', label: 'Gold', emoji: '🥇', min: 6, next: 11 },
    { key: 'diamond', label: 'Diamond', emoji: '💎', min: 11, next: null },
];

function getTierInfo(tier, count) {
    const current = TIERS.find((t) => t.key === tier) || TIERS[0];
    const nextTier = TIERS[TIERS.indexOf(current) + 1] || null;
    const progress = nextTier ? ((count - current.min) / (nextTier.min - current.min)) * 100 : 100;
    return { current, nextTier, progress: Math.min(progress, 100) };
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, session, isLoading } = useAuth();
    const [badges, setBadges] = useState(null);
    const [vote, setVote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/');
            return;
        }

        Promise.all([
            apiFetch('/api/votes/badges', {}, session),
            apiFetch('/api/votes/user', {}, session),
        ])
            .then(([badgeData, voteData]) => {
                setBadges(badgeData);
                setVote(voteData.vote);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user, session, isLoading, router]);

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header variant="page" />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin text-4xl mb-4">⚡</div>
                        <p className="comic-title text-2xl text-gray-900">LOADING PROFILE...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const count = badges?.count || 0;
    const tier = badges?.tier || 'none';
    const tierInfo = getTierInfo(tier, count);

    return (
        <div className="min-h-screen bg-yellow-50">
            <Head>
                <title>Your Profile — Badges & Voting History | ZerosByKai</title>
                <meta name="description" content="View your ZerosByKai profile, badge tier, voting history, and Kai's Pick badges earned from picking winning startup ideas." />
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <Header variant="page" />

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* User info */}
                <div className="mb-8">
                    <h1 className="comic-title text-4xl text-gray-900 mb-1">YOUR PROFILE</h1>
                    <p className="comic-body text-gray-600">{user.email}</p>
                </div>

                {/* Tier Card */}
                <div className="comic-panel bg-white p-8 comic-shadow mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-6xl">{tierInfo.current.emoji}</div>
                        <div>
                            <h2 className="comic-title text-3xl text-gray-900">
                                {tierInfo.current.label.toUpperCase()} SCOUT
                            </h2>
                            <p className="comic-body text-gray-600">
                                {count} Kai&apos;s Pick badge{count !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {tierInfo.nextTier && (
                        <div>
                            <div className="flex justify-between comic-body text-xs font-bold text-gray-500 mb-1">
                                <span>{tierInfo.current.label.toUpperCase()}</span>
                                <span>{tierInfo.nextTier.label.toUpperCase()} ({tierInfo.nextTier.min} badges)</span>
                            </div>
                            <div className="w-full bg-gray-200 border-2 border-black h-6 relative">
                                <div
                                    className="h-full bg-yellow-400 transition-all"
                                    style={{ width: `${tierInfo.progress}%` }}
                                />
                            </div>
                            <p className="comic-body text-xs text-gray-500 mt-1">
                                {tierInfo.nextTier.min - count} more badge{tierInfo.nextTier.min - count !== 1 ? 's' : ''} to {tierInfo.nextTier.label}
                            </p>
                        </div>
                    )}
                    {!tierInfo.nextTier && tier === 'diamond' && (
                        <p className="comic-title text-lg text-blue-500">MAX TIER REACHED!</p>
                    )}
                </div>

                {/* Current Vote */}
                <div className="comic-panel bg-white p-8 comic-shadow mb-8">
                    <h2 className="comic-title text-2xl text-gray-900 mb-4">THIS WEEK&apos;S VOTE</h2>
                    {vote ? (
                        <div className="border-2 border-black p-4 bg-yellow-50">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="comic-title text-lg text-black">{vote.idea?.name || 'Idea'}</span>
                                <span className="px-2 py-0.5 bg-yellow-400 border border-black comic-title text-xs">YOUR PICK</span>
                            </div>
                            <p className="comic-body text-sm text-gray-700">{vote.idea?.title || ''}</p>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                            <p className="comic-body text-gray-500 mb-3">You haven&apos;t voted this week yet.</p>
                            <Link
                                href="/"
                                className="inline-block px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors"
                            >
                                VOTE NOW
                            </Link>
                        </div>
                    )}
                </div>

                {/* Badge History */}
                <div className="comic-panel bg-white p-8 comic-shadow">
                    <h2 className="comic-title text-2xl text-gray-900 mb-4">BADGE HISTORY</h2>
                    {badges?.badges && badges.badges.length > 0 ? (
                        <div className="space-y-3">
                            {badges.badges.map((badge) => (
                                <div key={badge.id} className="flex items-center gap-4 p-3 border-2 border-gray-200 bg-gray-50">
                                    <div className="text-2xl">🎯</div>
                                    <div className="flex-1">
                                        <p className="comic-title text-sm text-black">
                                            {badge.idea?.name || 'Winning Pick'}
                                        </p>
                                        <p className="comic-body text-xs text-gray-500">
                                            {badge.idea?.title || ''}
                                        </p>
                                    </div>
                                    <div className="comic-body text-xs text-gray-400">
                                        {new Date(badge.awarded_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                            <p className="comic-body text-gray-500">
                                No badges yet. Vote for the winning idea to earn your first badge!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Sparkles, Zap, Mail, ChevronRight } from 'lucide-react';
import { useAuth, apiFetch, getApiUrl } from '@/lib/auth';
import { useSubscribe } from '@/hooks/useSubscribe';
import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import IdeaCard from '@/components/IdeaCard';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { faqSchema, sampleIdeas, sampleWinners } from '@/data/sampleData';

const VoteConfirmation = dynamic(() => import('@/components/VoteConfirmation'), {
    loading: () => null,
});

// Normalize DB fields to display fields
function normalizeIdea(idea) {
    return {
        ...idea,
        tag: idea.tags?.region || idea.tag || '🌍 Global',
        category: idea.tags?.category || idea.category || '',
        target: idea.target_audience || idea.target || '',
        why: idea.market_potential || idea.why || '',
    };
}

const ZerosByKaiLanding = () => {
    const { user, session, isLoading: authLoading, openAuthModal } = useAuth();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const { subscribe, status: subscribeStatus, error: subscribeError } = useSubscribe();

    // Real ideas state
    const [ideas, setIdeas] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [votingIdeaId, setVotingIdeaId] = useState(null);
    const [voteConfirmation, setVoteConfirmation] = useState(null);

    // State for hero subscribe button expansion
    const [showHeroSubscribe, setShowHeroSubscribe] = useState(false);

    // Fetch current week ideas (public)
    useEffect(() => {
        const url = `${getApiUrl()}/api/ideas/weekly`;
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                if (data.ideas && data.ideas.length > 0) {
                    setIdeas(data.ideas.map(normalizeIdea));
                }
            })
            .catch(() => { });

        // Fetch Leaderboard (Last Week's Winners)
        const leaderboardUrl = `${getApiUrl()}/api/ideas/leaderboard`;
        fetch(leaderboardUrl)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setLeaderboard(data.map(normalizeIdea));
                }
            })
            .catch(err => console.error("Leaderboard fetch error:", err));
    }, []);

    // Fetch user's current vote (if authenticated)
    useEffect(() => {
        if (!session) {
            setUserVote(null);
            return;
        }
        apiFetch('/api/votes/user', {}, session)
            .then((data) => {
                setUserVote(data.vote?.idea_id || null);
            })
            .catch(() => { });
    }, [session]);

    const displayIdeas = ideas || sampleIdeas;
    const isRealData = ideas !== null;

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const success = await subscribe({ email, name });
        if (success) {
            setEmail('');
            setName('');
        }
    };

    const scrollToIdeas = () => {
        const section = document.getElementById('ideas-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleVote = async (ideaId) => {
        if (!user) {
            openAuthModal('join');
            return;
        }
        if (votingIdeaId) return; // prevent double-click

        setVotingIdeaId(ideaId);
        try {
            const data = await apiFetch('/api/votes', {
                method: 'POST',
                body: JSON.stringify({ ideaId }),
            }, session);

            const votedIdea = displayIdeas.find((i) => i.id === ideaId);
            setVoteConfirmation({
                ideaName: votedIdea?.name || 'Idea',
                changed: data.changedFrom !== null,
            });
            setUserVote(ideaId);
        } catch (err) {
            // Vote errors are non-critical; the VoteConfirmation modal won't show
        } finally {
            setVotingIdeaId(null);
        }
    };

    const getVoteButtonProps = (ideaId) => {
        if (!user || !isRealData) {
            return { label: 'VOTE FOR THIS', style: 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black' };
        }
        if (userVote === ideaId) {
            return { label: '✓ YOUR PICK', style: 'bg-yellow-400 text-black border-yellow-500' };
        }
        if (userVote) {
            return { label: 'CHANGE TO THIS', style: 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black' };
        }
        return { label: 'VOTE FOR THIS', style: 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black' };
    };

    return (
        <div className="min-h-screen bg-white">
            <Script
                id="faq-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Head>
                <title>ZerosByKai | Validated Startup Ideas from Reddit — 10 New Business Opportunities Weekly</title>
                <meta name="description" content="Find your next validated startup idea. Kai curates 10 real business opportunities every Monday from thousands of Reddit threads. Free weekly startup ideas newsletter for entrepreneurs, indie hackers, and builders. No AI slop — just real pain points waiting to be built." />
                <meta name="keywords" content="startup ideas, validated business ideas, Reddit startup ideas, side project ideas, business opportunities, startup idea newsletter, indie hacker ideas, SaaS ideas, entrepreneur tools, startup validation, find startup ideas" />
                <meta property="og:title" content="ZerosByKai | Validated Startup Ideas from Reddit" />
                <meta property="og:description" content="10 validated startup ideas every Monday, curated from thousands of Reddit threads. Free business opportunity newsletter for founders and indie hackers." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="ZerosByKai | Validated Startup Ideas from Reddit" />
                <meta name="twitter:description" content="10 validated startup ideas every Monday from Reddit. Free for entrepreneurs, indie hackers & builders." />
                <meta name="twitter:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <link rel="canonical" href="https://zerosbykai.com/" />
            </Head>
            {/* Hero Section - Yellow Background */}
            <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 overflow-hidden">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 halftone"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-12">
                    {/* Header */}
                    <Header variant="landing" />

                    {/* Main Hero */}
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 lg:py-12">
                        {/* Left: Text Content */}
                        <div className="space-y-6 lg:space-y-8">
                            <div className="comic-panel p-3 sm:p-4 bg-white inline-block transform -rotate-2">
                                <p className="comic-body text-xs sm:text-sm font-bold uppercase text-black">⚡ Fresh Ideas Every Monday</p>
                            </div>

                            <h1 className="comic-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none text-gray-900">
                                FIND THE<br />
                                RIGHT <span className="text-rose-700">ZERO</span>
                            </h1>

                            <div className="comic-panel p-4 sm:p-6 bg-white max-w-xl border-l-4 sm:border-l-8 border-black">
                                <p className="comic-body text-base sm:text-lg lg:text-xl leading-relaxed text-black">
                                    &quot;In a world where <span className="font-bold bg-yellow-200 px-1 transform -rotate-1 inline-block">0 → 1</span> has become super easy,
                                    find the <span className="font-bold bg-rose-700 text-white px-2 transform rotate-1 inline-block">right ZERO.</span>&quot;
                                </p>
                            </div>

                            <p className="text-base sm:text-lg lg:text-xl text-gray-900 comic-body max-w-xl leading-relaxed">
                                <span className="font-bold">Zeros are startup ideas </span>that aren&apos;t AI-generated slop. Every week, Kai digs through
                                <span className="font-bold"> thousands of Reddit threads</span> to surface <span className="font-bold">real problems </span>
                                people won&apos;t shut up about. <span className="font-bold">Real opportunities.</span> No BS. No trend-chasing.
                                Just validated pain points waiting to be built.
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-900 comic-body max-w-xl mt-2 sm:mt-4">
                                For the <span className="font-bold">doers</span>. The <span className="font-bold">hustlers</span>.
                                The <span className="font-bold">builders</span> who actually ship.
                            </p>

                            {/* CTA: Newsletter subscribe (unauthenticated) or Welcome panel (authenticated) */}
                            {user ? (
                                <div className="comic-panel p-8 bg-white max-w-xl comic-shadow">
                                    <h3 className="comic-title text-2xl mb-3">
                                        WELCOME BACK{user.user_metadata?.name ? `, ${user.user_metadata.name.toUpperCase()}` : ''}!
                                    </h3>
                                    <p className="comic-body text-gray-700 mb-4">
                                        This week&apos;s ideas are live. Cast your vote and pick the winner.
                                    </p>
                                    <button
                                        onClick={scrollToIdeas}
                                        className="w-full px-6 py-4 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-all comic-shadow"
                                    >
                                        VOTE FOR YOUR PICK
                                    </button>
                                    {userVote && (
                                        <p className="comic-body text-sm text-green-700 mt-3 font-bold">✓ You&apos;ve voted this week</p>
                                    )}
                                </div>
                            ) : (
                                <div className="max-w-xl">
                                    <AnimatePresence mode="wait">
                                        {!showHeroSubscribe ? (
                                            <motion.button
                                                key="subscribe-button"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowHeroSubscribe(true)}
                                                className="group px-8 py-5 bg-black text-yellow-400 comic-title text-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 comic-shadow border-4 border-yellow-400"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Zap className="w-6 h-6" />
                                                    UNLOCK WEEKLY ZEROS
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </motion.button>
                                        ) : (
                                            <motion.div
                                                key="subscribe-form"
                                                initial={{ opacity: 0, height: 0, y: -20 }}
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0, y: -20 }}
                                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                                className="comic-panel p-8 bg-white comic-shadow overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="comic-title text-2xl text-black">GET THE WEEKLY ZEROS</h3>
                                                    <button
                                                        onClick={() => setShowHeroSubscribe(false)}
                                                        className="text-gray-400 hover:text-black transition-colors text-2xl font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                </div>

                                                {subscribeStatus === 'success' ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-center py-2"
                                                    >
                                                        <div className="text-4xl mb-3">⚡</div>
                                                        <h4 className="comic-title text-xl mb-2 text-black">YOU&apos;RE IN!</h4>
                                                        <p className="comic-body text-gray-700">First email drops Monday.</p>
                                                    </motion.div>
                                                ) : (
                                                    <form onSubmit={handleSubscribe} className="space-y-4">
                                                        <motion.input
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            placeholder="Your Name"
                                                            className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                                                            required
                                                        />
                                                        <motion.input
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="your@email.com"
                                                            className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                                                            required
                                                        />

                                                        {subscribeStatus === 'error' && (
                                                            <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                                                                {subscribeError}
                                                            </div>
                                                        )}

                                                        <motion.button
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.3 }}
                                                            type="submit"
                                                            disabled={subscribeStatus === 'loading'}
                                                            className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50"
                                                        >
                                                            {subscribeStatus === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE FREE'}
                                                        </motion.button>
                                                    </form>
                                                )}

                                                <p className="text-xs comic-body mt-3 text-gray-600">
                                                    ✓ Free forever &bull; ✓ Unsubscribe anytime &bull; ✓ No spam
                                                </p>
                                                <p className="text-xs comic-body mt-2 text-gray-500">
                                                    Want to vote &amp; earn badges?{' '}
                                                    <button
                                                        onClick={() => openAuthModal('join')}
                                                        className="text-rose-700 font-bold underline hover:text-rose-900"
                                                    >
                                                        Create an account &rarr;
                                                    </button>
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Right: Kai Character with Social Proof Cards */}
                        <div className="relative flex flex-col items-center mt-8 lg:mt-0">
                            {/* Container for Kai Image + Floating Cards */}
                            <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto">
                                {/* Social Proof Card: Meet Kai - Top Left */}
                                <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-8 z-30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                                    <div className="p-2 sm:p-3 comic-shadow border-3 border-yellow-400" style={{ background: '#000' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg sm:text-xl">👋</span>
                                            <div>
                                                <p className="comic-title text-xs sm:text-sm leading-none text-yellow-400">MEET KAI</p>
                                                <p className="comic-body text-[8px] sm:text-[10px] text-yellow-200">Your Idea Dealer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Kai Image */}
                                <div className="comic-panel comic-shadow p-2 bg-gradient-to-br from-yellow-200 to-yellow-100 rotate-2 z-10 relative">
                                    <Image
                                        src="/kai-hero.jpg"
                                        alt="Kai - AI-powered startup idea curator finding validated business opportunities from Reddit"
                                        width={682}
                                        height={1024}
                                        className="w-full h-auto border-2 sm:border-4 border-black"
                                        style={{
                                            filter: 'contrast(1.1) brightness(1.05)',
                                        }}
                                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 400px, 450px"
                                        priority
                                    />
                                </div>

                                {/* Social Proof Card: Best Analyst - Bottom Right */}
                                <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-8 z-30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <div className="p-2 sm:p-3 comic-shadow border-3 border-black" style={{ background: '#be123c' }}>
                                        <p className="comic-title text-[10px] sm:text-xs leading-tight text-center text-white">
                                            🏆 WORLD&apos;S MOST<br />
                                            <span className="text-yellow-300">OBSESSIVE</span><br />
                                            REDDIT ANALYST
                                        </p>
                                    </div>
                                </div>

                                {/* Bonus Card: Stats - Top Right, more subtle */}
                                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-6 z-20 transform rotate-6 hidden sm:block">
                                    <div className="bg-white border-2 border-black px-2 py-1 shadow-md">
                                        <p className="comic-body text-[8px] sm:text-[10px] font-bold text-gray-700">
                                            📊 2,347+ threads/week
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section id="ideas-section" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-yellow-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16">
                        <div className="inline-block bg-black text-white px-4 sm:px-6 py-2 comic-title text-base sm:text-xl mb-4 transform -rotate-1">
                            FRESH FROM REDDIT
                        </div>
                        <h2 className="comic-title text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 text-gray-900 drop-shadow-sm">THIS WEEK&apos;S ZEROS</h2>
                        <p className="comic-body text-base sm:text-lg lg:text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed border-l-4 border-yellow-400 pl-4 sm:pl-6 text-left bg-white p-3 sm:p-4 shadow-sm">
                            <span className="font-bold text-black">10 ideas. One vote.</span> Pick the opportunity you&apos;d bet on.
                            If it wins, you earn a Zero Finder badge.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16 max-w-6xl mx-auto">
                        {displayIdeas.map((idea, index) => (
                            <IdeaCard
                                key={idea.id}
                                idea={idea}
                                index={index}
                                isUserPick={user && isRealData && userVote === idea.id}
                                btnProps={getVoteButtonProps(idea.id)}
                                votingIdeaId={votingIdeaId}
                                onVote={handleVote}
                            />
                        ))}
                    </div>

                    {!user && (
                        <div className="text-center">
                            <div className="comic-panel inline-block p-6 bg-yellow-400 comic-shadow">
                                <p className="comic-body font-bold text-lg mb-4 text-black">
                                    Sign up to pick your winner and earn Zero Finder badges
                                </p>
                                <button
                                    onClick={() => openAuthModal('join')}
                                    className="px-8 py-3 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-colors"
                                >
                                    GET STARTED
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Leaderboard - Last Week's Winners */}
            <Leaderboard winners={leaderboard || sampleWinners} />



            {/* How It Works Section */}
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-center mb-10 sm:mb-16 text-black">HOW IT WORKS</h2>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                        {/* Step 1 */}
                        <div className="text-center group hover:-translate-y-2 transition-transform duration-300">
                            <div className="comic-panel p-3 sm:p-4 bg-yellow-100 mb-4 sm:mb-6 inline-block transform -rotate-2 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-stash.png" alt="Weekly startup ideas delivered every Monday from Reddit threads" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">1. GET THE STASH</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                Every Monday: <span className="font-bold text-black">10 opportunities</span> scraped from thousands of Reddit threads.
                                No fluff. No AI hallucinations. Just real problems people are screaming about.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center group hover:-translate-y-2 transition-transform duration-300 delay-100">
                            <div className="comic-panel p-3 sm:p-4 bg-blue-100 mb-4 sm:mb-6 inline-block transform rotate-2 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-target.png" alt="Vote on validated startup ideas and pick the best business opportunity" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">2. PICK YOUR WINNER</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                <span className="font-bold text-black">One vote. One idea.</span> Which problem would you solve?
                                Which opportunity would you bet on? Make your call.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center group hover:-translate-y-2 transition-transform duration-300 delay-200 sm:col-span-2 md:col-span-1">
                            <div className="comic-panel p-3 sm:p-4 bg-rose-100 mb-4 sm:mb-6 inline-block badge-shine transform -rotate-1 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-trophy.png" alt="Earn badges for picking winning startup ideas" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">3. EARN YOUR BADGE</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                Pick the winning idea? <span className="font-bold text-black">Zero Finder badge unlocked.</span> Prove you&apos;ve
                                got the nose for opportunities. Stack badges. Become a Diamond Finder.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Badge Tiers Section */}
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gray-900 text-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-center mb-3 sm:mb-4 text-yellow-400">ZERO FINDER BADGES</h2>
                    <p className="comic-body text-center text-base sm:text-lg lg:text-xl mb-8 sm:mb-12">
                        Find the golden Zeros. Stack your wins. Become the next Kai.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <div className="comic-panel p-4 sm:p-6 bg-gray-800 text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">🥉</div>
                            <h3 className="comic-title text-base sm:text-lg lg:text-xl mb-1 sm:mb-2 text-yellow-400">BRONZE FINDER</h3>
                            <p className="comic-body text-xs sm:text-sm text-gray-400">1-2 winning picks</p>
                        </div>
                        <div className="comic-panel p-4 sm:p-6 bg-gray-800 text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">🥈</div>
                            <h3 className="comic-title text-base sm:text-lg lg:text-xl mb-1 sm:mb-2 text-gray-300">SILVER FINDER</h3>
                            <p className="comic-body text-xs sm:text-sm text-gray-400">3-5 winning picks</p>
                        </div>
                        <div className="comic-panel p-4 sm:p-6 bg-gray-800 text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">🥇</div>
                            <h3 className="comic-title text-base sm:text-lg lg:text-xl mb-1 sm:mb-2 text-yellow-300">GOLD FINDER</h3>
                            <p className="comic-body text-xs sm:text-sm text-gray-400">6-10 winning picks</p>
                        </div>
                        <div className="comic-panel p-4 sm:p-6 bg-gray-800 text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">💎</div>
                            <h3 className="comic-title text-base sm:text-lg lg:text-xl mb-1 sm:mb-2 text-blue-300">DIAMOND FINDER</h3>
                            <p className="comic-body text-xs sm:text-sm text-gray-400">11+ winning picks</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Kai Section - Newspaper Clippings Style */}
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 halftone"></div>

                <div className="relative max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-10 sm:mb-16">
                        <div className="inline-block bg-black text-yellow-400 px-4 sm:px-6 py-2 comic-title text-base sm:text-xl mb-4 transform rotate-1 border-2 border-yellow-400">
                            ⚡ WHY BUILDERS TRUST KAI
                        </div>
                        <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black drop-shadow-sm">
                            NOT YOUR AVERAGE<br />
                            <span className="text-rose-700">IDEA NEWSLETTER</span>
                        </h2>
                    </div>

                    {/* Newspaper Clippings Grid */}
                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Card 1: The Builder */}
                        <div className="comic-panel p-5 sm:p-6 lg:p-8 bg-white transform md:-rotate-2 hover:rotate-0 transition-transform duration-300 comic-shadow relative">
                            <div className="absolute -top-4 left-4 bg-blue-600 text-white border-2 border-black px-3 py-1 comic-title text-xs transform -rotate-2 uppercase tracking-wider">
                                FOR THE BUILDER
                            </div>
                            <div className="mt-4">
                                <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                    YOU&apos;VE GOT THE SKILLS.<br />
                                    <span className="text-blue-600">YOU CAN SHIP.</span>
                                </h3>
                                <div className="border-l-4 border-blue-600 pl-4 mb-4">
                                    <p className="comic-body text-sm text-gray-800">
                                        But you&apos;re stuck in <span className="font-bold bg-blue-100 px-1">analysis paralysis</span>,
                                        endlessly scrolling for that perfect idea while your competitor ships garbage and wins.
                                    </p>
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                    <p className="comic-title text-lg sm:text-xl text-blue-700 leading-tight">
                                        KAI FINDS THE 0.<br />
                                        YOU BUILD THE 1.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: The Veteran */}
                        <div className="comic-panel p-5 sm:p-6 lg:p-8 bg-white transform md:rotate-1 hover:rotate-0 transition-transform duration-300 comic-shadow relative md:mt-8">
                            <div className="absolute -top-4 right-4 bg-purple-600 text-white border-2 border-black px-3 py-1 comic-title text-xs transform rotate-2 uppercase tracking-wider">
                                FOR THE VETERAN
                            </div>
                            <div className="mt-4">
                                <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                    YOU&apos;VE LAUNCHED BEFORE.<br />
                                    <span className="text-purple-600">YOU KNOW THE GAME.</span>
                                </h3>
                                <div className="border-l-4 border-purple-600 pl-4 mb-4">
                                    <p className="comic-body text-sm text-gray-800">
                                        But finding validated problems is brutal. <span className="font-bold bg-purple-100 px-1">Reddit has gold buried</span> in thousands of angry rants—if you know where to look.
                                    </p>
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                    <p className="comic-title text-lg sm:text-xl text-purple-700 leading-tight">
                                        KAI DOES THE DIGGING.<br />
                                        YOU DO THE BUILDING.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: The Investor */}
                        <div className="comic-panel p-5 sm:p-6 lg:p-8 bg-white transform md:-rotate-1 hover:rotate-0 transition-transform duration-300 comic-shadow relative">
                            <div className="absolute -top-4 left-4 bg-emerald-600 text-white border-2 border-black px-3 py-1 comic-title text-xs transform -rotate-2 uppercase tracking-wider">
                                FOR THE INVESTOR
                            </div>
                            <div className="mt-4">
                                <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                    YOU&apos;VE GOT THE CAPITAL.<br />
                                    <span className="text-emerald-600">YOU NEED THE SIGNAL.</span>
                                </h3>
                                <div className="border-l-4 border-emerald-600 pl-4 mb-4">
                                    <p className="comic-body text-sm text-gray-800">
                                        Tired of founders pitching <span className="font-bold bg-emerald-100 px-1">&quot;AI for dogs&quot;</span> and calling it revolutionary?
                                        You want opportunities backed by people begging to pay.
                                    </p>
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                    <p className="comic-title text-lg sm:text-xl text-emerald-700 leading-tight">
                                        KAI FILTERS THE NOISE.<br />
                                        YOU PLACE THE BETS.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Tagline */}
                    <div className="mt-10 sm:mt-16 text-center">
                        <div className="inline-block p-4 sm:p-6 comic-shadow transform -rotate-1 border-3 border-black" style={{ background: '#000' }}>
                            <p className="comic-title text-xl sm:text-2xl lg:text-3xl text-yellow-400">
                                WHILE YOU&apos;RE BRAINSTORMING,<br />
                                <span className="text-white">SOMEONE&apos;S ALREADY BUILDING YOUR IDEA.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Startup Ideas / SEO Section */}
            <section className="bg-black py-12 sm:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden border-t-4 border-b-4 border-black">
                {/* Diagonal striping pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)' }}>
                </div>

                <div className="relative max-w-5xl mx-auto text-center">
                    <div className="comic-panel inline-block bg-yellow-400 p-3 sm:p-4 transform -rotate-2 mb-6 sm:mb-8 border-2 sm:border-4 border-white comic-shadow-white">
                        <h2 className="comic-title text-lg sm:text-2xl md:text-3xl text-black uppercase tracking-widest">
                            ⚠️ WARNING: REALITY CHECK ⚠️
                        </h2>
                    </div>

                    <h2 className="comic-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 sm:mb-8 leading-none drop-shadow-[4px_4px_0_rgba(180,83,9,1)]">
                        LOOKING FOR YOUR NEXT<br />
                        <span className="text-yellow-400">MILLION DOLLAR IDEA?</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                        <div className="comic-panel bg-white p-5 sm:p-6 lg:p-8 transform rotate-1 comic-shadow">
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 sm:mb-4 text-rose-700">THIS IS NOT A STARTUP IDEA GENERATOR.</h3>
                            <p className="comic-body text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-black">
                                Stop scrolling for random <span className="font-bold bg-yellow-200 px-1 text-black">business ideas</span>.
                                Ideas are cheap. &quot;Uber for Dogs&quot; is not a business plan.
                            </p>
                            <p className="comic-body text-sm sm:text-base lg:text-lg text-black">
                                You don&apos;t need a random idea generator spouting nonsense. You need
                                <span className="font-bold bg-black text-white px-1 mx-1">validated pain points</span>
                                from real humans who are begging for a solution.
                            </p>
                        </div>

                        <div className="comic-panel bg-yellow-400 p-5 sm:p-6 lg:p-8 transform -rotate-1 comic-shadow">
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 sm:mb-4 text-black">THE TRUTH ABOUT UNICORNS 🦄</h3>
                            <p className="comic-body text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-black">
                                The next <span className="font-bold text-black">big startup idea</span> isn&apos;t in a brainstorm session.
                                It&apos;s hidden in a Reddit thread where 500 people are angry about the same thing.
                            </p>
                            <p className="comic-body text-sm sm:text-base lg:text-lg text-black">
                                We don&apos;t give you &quot;clever concepts&quot;. We give you:
                                <br />
                                <span className="font-bold block mt-2 text-black">
                                    &quot;I have $500 ready to pay for this software but it doesn&apos;t exist.&quot;
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12">
                        <p className="comic-title text-lg sm:text-xl lg:text-2xl text-white mb-4 sm:mb-6">
                            THAT IS YOUR NEXT STARTUP. THAT IS YOUR OPPORTUNITY.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            {!user && (
                <section className="bg-gradient-to-br from-yellow-400 to-amber-400 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 halftone"></div>
                    <div className="relative max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            {/* Left: Text Content */}
                            <div className="text-center lg:text-left">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                    className="comic-title text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 text-black"
                                >
                                    STOP GUESSING.<br />START BUILDING.
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="comic-body text-lg sm:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0 text-black"
                                >
                                    <span className="font-bold">10 validated opportunities</span> land in your inbox every Monday.
                                    No AI slop. No fake problems. Just real pain points from <span className="font-bold">thousands of Reddit threads.</span>
                                </motion.p>

                                {/* Social proof badges */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start"
                                >
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                        <Sparkles className="w-4 h-4" /> Every Monday
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                        <Zap className="w-4 h-4" /> 100% Free
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                        <Mail className="w-4 h-4" /> No Spam
                                    </span>
                                </motion.div>
                            </div>

                            {/* Right: Subscribe Form */}
                            <motion.div
                                initial={{ opacity: 0, x: 30, rotate: 1 }}
                                whileInView={{ opacity: 1, x: 0, rotate: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="comic-panel p-6 sm:p-8 bg-white comic-shadow transform rotate-1 hover:rotate-0 transition-transform duration-300"
                            >
                                <h3 className="comic-title text-xl sm:text-2xl mb-4 text-black flex items-center gap-2">
                                    <Mail className="w-6 h-6 text-rose-700" />
                                    GET THE WEEKLY ZEROS
                                </h3>

                                {subscribeStatus === 'success' ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >
                                        <div className="text-5xl mb-3">⚡</div>
                                        <h4 className="comic-title text-2xl mb-2 text-black">YOU&apos;RE IN!</h4>
                                        <p className="comic-body text-gray-700">First email drops Monday.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="space-y-4">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black bg-white"
                                            required
                                        />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black bg-white"
                                            required
                                        />

                                        {subscribeStatus === 'error' && (
                                            <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                                                {subscribeError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={subscribeStatus === 'loading'}
                                            className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {subscribeStatus === 'loading' ? 'SUBSCRIBING...' : (
                                                <>
                                                    SUBSCRIBE FREE
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                <p className="text-xs comic-body mt-4 text-gray-600 text-center">
                                    ✓ Free forever &bull; ✓ Unsubscribe anytime &bull; ✓ No spam
                                </p>
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
                                    <p className="text-sm comic-body text-gray-600">
                                        Want to vote &amp; earn badges?
                                    </p>
                                    <button
                                        onClick={() => openAuthModal('join')}
                                        className="mt-2 text-rose-700 font-bold comic-body hover:text-rose-900 inline-flex items-center gap-1 underline"
                                    >
                                        Create an account <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            {/* Vote Confirmation Modal */}
            {voteConfirmation && (
                <VoteConfirmation
                    ideaName={voteConfirmation.ideaName}
                    changed={voteConfirmation.changed}
                    onClose={() => setVoteConfirmation(null)}
                />
            )}
        </div>
    );
};

export default ZerosByKaiLanding;

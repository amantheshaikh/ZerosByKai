import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Sparkles, Zap, Mail, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import IdeaCarousel from '@/components/IdeaCarousel';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { faqSchema, sampleIdeas, sampleWinners } from '@/data/sampleData';
import Particles from '@/components/Particles';
import RotatingText from '@/components/RotatingText';
import { TypingAnimation } from "@/components/ui/typing-animation";
import Reveal, { RevealContainer, RevealItem } from '@/components/animations/Reveal';

const VoteConfirmation = dynamic(() => import('@/components/ui/vote-confirmation'), {
    loading: () => null,
});

import { normalizeIdea } from '@/lib/utils';
import {
    fetchCurrentWeekIdeas,
    fetchLeaderboard,
    castVote,
    getUserVote
} from '@/lib/ideas';

// Constants
const VOTE_ERROR_TIMEOUT = 5000;
const LIVE_SIGNAL_SOURCES = ['Reddit', 'Hacker News', 'X (Twitter)', 'Indie Hackers'];
const MISSION_DESIGNATIONS = [
    { img: '/badges/bronze-circle.png', title: 'ONLOOKER', tier: '0-2 winning picks', color: 'text-gray-400', special: '' },
    { img: '/badges/silver-pentagon.png', title: 'FIELD AGENT', tier: '3-6 winning picks', color: 'text-gray-300', special: '' },
    { img: '/badges/gold-hexagon.png', title: 'LEAD ANALYST', tier: '7-11 winning picks', color: 'text-yellow-400', special: '' },
    { img: '/badges/platinum-shield.png', title: 'HEAD OF INTEL', tier: '12-19 winning picks', color: 'text-yellow-500', special: 'Expert' },
    { img: '/badges/unicorn-prism.png', title: 'UNICORN HUNTER', tier: '20+ winning picks', color: 'text-indigo-400', special: 'Legendary' }
];

const ZerosByKaiLanding = ({ initialIdeas = [], initialLeaderboard = [] }) => {
    const { user, session, openAuthModal, subscribeNewsletter } = useAuth();
    const errorTimeoutRef = useRef(null);

    // Form state
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState('idle');
    const [subscribeError, setSubscribeError] = useState(null);

    // Ideas state
    const [ideas, setIdeas] = useState(initialIdeas);
    const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
    const [userVote, setUserVote] = useState(null);
    const [votingIdeaId, setVotingIdeaId] = useState(null);
    const [voteConfirmation, setVoteConfirmation] = useState(null);
    const [voteError, setVoteError] = useState(null);

    // Fetch ideas and leaderboard on mount (refresh data)
    useEffect(() => {
        // Optimistically show initial props, then re-fetch to ensure freshness if needed
        fetchCurrentWeekIdeas().then(data => {
            if (data.length > 0) setIdeas(data);
        });
        fetchLeaderboard().then(data => {
            if (data.length > 0) setLeaderboard(data);
        });
    }, []);

    // Fetch user's current vote
    useEffect(() => {
        if (!session) {
            setUserVote(null);
            return;
        }
        getUserVote(session).then(setUserVote);
    }, [session]);

    // Cleanup error timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    const displayIdeas = (ideas && ideas.length > 0) ? ideas : sampleIdeas.map(normalizeIdea);
    const isRealData = ideas !== null && ideas.length > 0;

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setSubscribeStatus('loading');
        setSubscribeError(null);
        try {
            await subscribeNewsletter(email);
            setSubscribeStatus('success');
            setEmail('');
        } catch (err) {
            setSubscribeError(err.message || 'Subscription failed');
            setSubscribeStatus('error');
        }
    };

    const handleVote = async (ideaId) => {
        if (!user) {
            openAuthModal();
            return;
        }
        if (votingIdeaId) return;

        setVotingIdeaId(ideaId);
        try {
            const data = await castVote(ideaId, session);
            const votedIdea = displayIdeas.find((i) => i.id === ideaId);

            setVoteConfirmation({
                ideaName: votedIdea?.name || 'Idea',
                changed: data.changedFrom !== null,
            });
            setUserVote(ideaId);
            setVoteError(null);
        } catch (err) {
            console.error('Voting error:', err);
            const errorMsg = err.message || 'Failed to cast vote. Please try again.';
            setVoteError(errorMsg);

            // Clear previous timeout if exists
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }

            errorTimeoutRef.current = setTimeout(() => {
                setVoteError(null);
                errorTimeoutRef.current = null;
            }, VOTE_ERROR_TIMEOUT);
        } finally {
            setVotingIdeaId(null);
        }
    };

    const getVoteButtonProps = (ideaId) => {
        const defaultStyle = 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black';

        if (!user || !isRealData) {
            return { label: 'VOTE FOR THIS', style: defaultStyle };
        }
        if (userVote === ideaId) {
            return { label: '✓ YOUR PICK', style: 'bg-yellow-400 text-black border-yellow-500' };
        }
        if (userVote) {
            return { label: 'CHANGE TO THIS', style: defaultStyle };
        }
        return { label: 'VOTE FOR THIS', style: defaultStyle };
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
                <title>ZerosByKai | 10 Validated Startup Ideas Weekly</title>
                <meta name="description" content="Find your next validated startup idea. Kai curates 10 real business opportunities every Monday from the internet's chaos. Free weekly startup ideas newsletter for entrepreneurs, indie hackers, and builders. No AI slop — just real pain points waiting to be built." />
                <meta name="keywords" content="startup ideas, validated business ideas, internet startup ideas, side project ideas, business opportunities, startup idea newsletter, indie hacker ideas, SaaS ideas, entrepreneur tools, startup validation, find startup ideas" />
                <meta property="og:title" content="ZerosByKai | Real Problems. Real Startup Ideas" />
                <meta property="og:description" content="10 validated startup ideas every Monday, curated from millions of online conversations. Free business opportunity newsletter for founders and indie hackers." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="ZerosByKai | Real Problems. Real Startup Ideas" />
                <meta name="twitter:description" content="10 validated startup ideas every Monday from the internet's noise. Free for entrepreneurs, indie hackers & builders." />
                <meta name="twitter:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <link rel="canonical" href="https://zerosbykai.com/" />
            </Head>
            <Header variant="landing" />
            {/* Hero Section - Yellow Background */}
            <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 overflow-hidden">
                {/* Particles Background animation */}
                <div className="absolute inset-0 opacity-20 z-0">
                    <Particles
                        particleColors={['#000000']}
                        particleCount={800}
                        particleSpread={12}
                        speed={0.1}
                        particleBaseSize={200}
                        moveParticlesOnHover={true}
                        alphaParticles={true}
                        disableRotation={false}
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-6">

                    {/* Main Hero */}
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-4 lg:py-6">
                        {/* Left: Text Content */}
                        <div className="space-y-6 lg:space-y-8">
                            <div className="comic-panel p-3 sm:p-4 bg-white inline-block transform -rotate-2">
                                <p className="comic-body text-xs sm:text-sm font-bold uppercase text-black">⚡ Fresh Ideas Every Monday</p>
                            </div>

                            <h1 className="comic-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none text-gray-900">
                                FIND THE<br />
                                RIGHT <span className="text-rose-700">
                                    <TypingAnimation showCursor={false} loop={true} delay={400} typeSpeed={100} deleteSpeed={100} startOnView={false}>ZER</TypingAnimation>O  {/*this is intentional*/}
                                </span>
                            </h1>

                            <div className="comic-panel p-4 sm:p-6 bg-white max-w-xl border-l-4 sm:border-l-8 border-black">
                                <p className="comic-body text-base sm:text-lg lg:text-xl leading-relaxed text-black">
                                    &quot;In a world where <span className="font-bold bg-yellow-200 px-1 transform -rotate-1 inline-block">0 → 1</span> has become super easy,
                                    find the <span className="font-bold bg-rose-700 text-white px-2 transform rotate-1 inline-block">right ZERO.</span>&quot;
                                </p>
                            </div>

                            <p className="text-base sm:text-lg lg:text-xl text-gray-900 comic-body max-w-xl leading-relaxed">
                                <span className="font-bold">Zeros are startup ideas </span>that aren&apos;t AI-generated slop. Every week, Kai digs through
                                <span className="font-bold"> millions of internet conversations</span> to surface <span className="font-bold">real problems </span>
                                people won&apos;t shut up about. <span className="font-bold">Real opportunities.</span> No BS. No trend-chasing.
                                Just validated pain points waiting to be built.
                            </p>
                        </div>

                        {/* Right: Kai Character with Social Proof Cards */}
                        <div className="relative flex flex-col items-center mt-0 lg:mt-0">
                            {/* Container for Kai Image + Floating Cards */}
                            <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto scale-90">
                                {/* Social Proof Card: Meet Kai - Top Left */}
                                <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-8 z-30 transform -rotate-6 animate-bob">
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
                                        alt="Kai - AI-powered startup idea curator finding validated business opportunities from the internet's noise"
                                        width={546}
                                        height={820}
                                        className="w-full h-auto border-2 sm:border-4 border-black"
                                        style={{
                                            filter: 'contrast(1.1) brightness(1.05)',
                                        }}
                                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 400px, 450px"
                                        priority
                                    />
                                </div>

                                {/* Social Proof Card: Best Analyst - Bottom Right */}
                                <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-8 z-30 transform rotate-3 animate-bob" style={{ animationDelay: '1s' }}>
                                    <div className="p-2 sm:p-3 comic-shadow border-3 border-black" style={{ background: '#be123c' }}>
                                        <p className="comic-title text-[10px] sm:text-xs leading-tight text-center text-white">
                                            🏆 WORLD&apos;S BEST<br />
                                            <span className="text-yellow-300">PROBLEM HUNTER</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Bonus Card: Stats - Top Right */}
                                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-6 z-20 transform rotate-6 animate-bob" style={{ animationDelay: '2s' }}>
                                    <div className="p-2 sm:p-3 comic-shadow border-3 border-black bg-white">
                                        <p className="comic-body text-[8px] sm:text-[10px] font-bold text-gray-700">
                                            🏅 EMPLOYEE OF THE MONTH<br />(EVERY MONTH)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Signal Ticker - The Sources */}
            <div className="bg-black py-4 border-y-4 border-black overflow-hidden relative flex items-center">
                {/* Title overlay */}
                <div className="absolute left-0 top-0 bottom-0 bg-black z-20 flex items-center px-4 sm:px-8 shadow-[10px_0_15px_rgba(0,0,0,0.9)] border-r border-yellow-400/20">
                    <span className="comic-title text-sm sm:text-base tracking-widest whitespace-nowrap text-yellow-400 opacity-90">⚡ LIVE SIGNAL FEEDS:</span>
                </div>

                <div className="flex overflow-hidden">
                    <div className="flex gap-12 sm:gap-24 items-center animate-marquee whitespace-nowrap pl-48 sm:pl-64">
                        {[0, 1, 2].map((repeatIdx) => (
                            <div key={repeatIdx} className="flex gap-12 sm:gap-24 comic-body text-[11px] sm:text-sm font-bold text-white tracking-widest uppercase items-center">
                                {LIVE_SIGNAL_SOURCES.map((source, idx) => (
                                    <span key={source} className="flex items-center gap-2">
                                        <span className={`w-2 h-2 bg-green-500 rounded-full animate-pulse ${idx > 0 ? `animate-delay-${idx * 75}` : ''}`}></span>
                                        {source}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            <section id="ideas-section" className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 bg-yellow-50 overflow-x-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-6 sm:mb-6">
                        <div className="inline-block bg-black text-white px-4 sm:px-6 py-2 comic-title text-base sm:text-xl mb-4 transform -rotate-1">
                            FRESH FROM THE CHAOS
                        </div>
                        <h2 className="comic-title text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 text-gray-900 drop-shadow-sm">THIS WEEK&apos;S ZEROS</h2>
                        <p className="comic-body text-base sm:text-lg lg:text-xl text-gray-800 w-full mx-auto leading-relaxed border-l-4 border-yellow-400 pl-4 sm:pl-6 text-left bg-white p-3 sm:p-4 shadow-sm">
                            <span className="font-bold text-black">10 ideas. One vote.</span> Pick the opportunity you&apos;d bet on.
                            If it wins, you earn a badge—and level up your designation.
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <IdeaCarousel
                            ideas={displayIdeas}
                            user={user}
                            isRealData={isRealData}
                            userVote={userVote}
                            votingIdeaId={votingIdeaId}
                            onVote={handleVote}
                            getVoteButtonProps={getVoteButtonProps}
                        />
                    </div>

                    {/* Vote Error Message */}
                    <AnimatePresence>
                        {voteError && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="fixed bottom-4 right-4 z-50 comic-panel p-4 bg-rose-100 border-2 border-rose-700 text-rose-700 comic-body comic-shadow shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <div>
                                        <p className="font-bold">Ouch! Vote failed.</p>
                                        <p className="text-sm">{voteError}</p>
                                    </div>
                                    <button
                                        onClick={() => setVoteError(null)}
                                        className="ml-4 text-rose-900 hover:text-rose-700 font-bold"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Leaderboard - Last Week's Winners */}
            <Leaderboard winners={leaderboard || sampleWinners.map(normalizeIdea)} />

            {/* How It Works Section */}
            <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-white overflow-hidden">
                <RevealContainer
                    className="max-w-6xl mx-auto"
                    stagger={0.15}
                    rootMargin="-100px 0px"
                >
                    <RevealItem
                        type="slide"
                        direction="up"
                        spring="gentle"
                        className="text-center mb-6 sm:mb-10"
                    >
                        <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black">
                            HOW IT WORKS
                        </h2>
                    </RevealItem>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                        {/* Step 1 */}
                        <RevealItem
                            type="slide"
                            direction="up"
                            spring="snappy"
                            className="text-center group"
                            hover={{ y: -8 }}
                            tap={{ scale: 0.96 }}
                        >
                            <div className="comic-panel p-3 sm:p-4 bg-yellow-100 mb-4 sm:mb-6 inline-block transform -rotate-2 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-stash.png" alt="Weekly startup ideas delivered every Monday from internet noise" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">1. GET THE STASH</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                Every Monday: <span className="font-bold text-black">10 opportunities</span> scraped from the noise of the internet.
                                No fluff. No AI hallucinations. Just real problems people are screaming about.
                            </p>
                        </RevealItem>

                        {/* Step 2 */}
                        <RevealItem
                            type="slide"
                            direction="up"
                            spring="snappy"
                            className="text-center group"
                            hover={{ y: -8 }}
                            tap={{ scale: 0.96 }}
                        >
                            <div className="comic-panel p-3 sm:p-4 bg-blue-100 mb-4 sm:mb-6 inline-block transform rotate-2 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-target.png" alt="Vote on validated startup ideas and pick the best business opportunity" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">2. PICK YOUR WINNER</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                <span className="font-bold text-black">One vote. One idea.</span> Which problem would you solve?
                                Which opportunity would you bet on? Make your call.
                            </p>
                        </RevealItem>

                        {/* Step 3 */}
                        <RevealItem
                            type="slide"
                            direction="up"
                            spring="snappy"
                            className="text-center group sm:col-span-2 md:col-span-1"
                            hover={{ y: -8 }}
                            tap={{ scale: 0.96 }}
                        >
                            <div className="comic-panel p-3 sm:p-4 bg-rose-100 mb-4 sm:mb-6 inline-block badge-shine transform -rotate-1 group-hover:rotate-0 transition-transform">
                                <Image src="/icon-trophy.png" alt="Earn badges for picking winning startup ideas" width={128} height={128} className="w-20 h-20 sm:w-32 sm:h-32 object-contain" />
                            </div>
                            <h3 className="comic-title text-xl sm:text-2xl mb-2 sm:mb-3 text-black">3. EARN YOUR BADGE</h3>
                            <p className="comic-body text-sm sm:text-base text-gray-700">
                                Pick the winning idea? <span className="font-bold text-black">Badge unlocked.</span> Level up your designation and prove you&apos;ve
                                got the nose for opportunities. Stack wins. Become a Unicorn Hunter.
                            </p>
                        </RevealItem>
                    </div>
                </RevealContainer>
            </section>

            {/* Designation Tiers Section */}
            <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-gray-900 text-white overflow-hidden">
                <RevealContainer
                    className="max-w-6xl mx-auto"
                    stagger={0.08}
                    rootMargin="-100px 0px"
                >
                    <RevealItem
                        type="scale"
                        spring="bouncy"
                        className="text-center mb-2 sm:mb-3"
                    >
                        <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-yellow-400">
                            MISSION DESIGNATIONS
                        </h2>
                    </RevealItem>
                    <RevealItem
                        type="fade"
                        spring="gentle"
                        className="text-center mb-6 sm:mb-8"
                    >
                        <p className="comic-body text-base sm:text-lg lg:text-xl">
                            Stop lurking. Start building your record. Prove you can spot the signal.
                        </p>
                    </RevealItem>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-6">
                        {MISSION_DESIGNATIONS.map((tier, idx) => (
                            <RevealItem
                                key={tier.title}
                                type="scaleRotate"
                                spring="snappy"
                                className={`comic-panel p-4 sm:p-5 text-center border-gray-700 relative overflow-visible group ${idx === 4 ? 'bg-gradient-to-br from-indigo-900 to-gray-800 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-gray-800'}`}
                                hover={{ scale: 1.05, borderColor: idx === 4 ? '#818cf8' : '#fbbf24', zIndex: 10 }}
                                tap={{ scale: 0.96 }}
                            >
                                {tier.special && (
                                    <div className={`absolute top-0 right-0 ${idx === 4 ? 'bg-indigo-500' : 'bg-yellow-400'} text-black text-[8px] font-bold px-1 uppercase z-20`}>
                                        {tier.special}
                                    </div>
                                )}

                                <div className="relative mb-3 sm:mb-4 h-24 sm:h-28 flex items-center justify-center">
                                    <div className={`badge-container relative w-20 h-20 sm:w-24 sm:h-24 transition-all duration-500 ${idx === 4 ? 'animate-pulse-slow' : ''}`}>
                                        <Image
                                            src={tier.img}
                                            alt={tier.title}
                                            fill
                                            sizes="(max-width: 640px) 80px, 96px"
                                            className="drop-shadow-2xl filter brightness-110 mix-blend-screen object-contain"
                                        />
                                        {/* Reflection effect */}
                                        <div className="absolute -bottom-8 left-0 right-0 h-full opacity-30 transform scale-y-[-0.5] mask-linear-gradient pointer-events-none">
                                            <Image
                                                src={tier.img}
                                                alt=""
                                                fill
                                                sizes="(max-width: 640px) 80px, 96px"
                                                className="mix-blend-screen object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <h3 className={`comic-title text-base sm:text-lg mb-1 ${tier.color} relative z-10`}>{tier.title}</h3>
                                <p className={`comic-body text-[10px] sm:text-xs uppercase font-bold tracking-tight ${idx === 4 ? 'text-indigo-300/60' : 'text-gray-500'} relative z-10`}>{tier.tier}</p>

                                {/* Hover Shine Effect */}
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay"></div>
                            </RevealItem>
                        ))}
                    </div>
                </RevealContainer>
            </section>

            {/* Why Kai Section - Newspaper Clippings Style */}
            <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 halftone"></div>

                <div className="relative max-w-6xl mx-auto">
                    {/* Section Header */}
                    <Reveal type="fade" delay={0} className="text-center mb-6 sm:mb-10">
                        <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black drop-shadow-sm">
                            <div>This is for you, if you're a</div>
                            <div className="mt-4 flex justify-center">
                                <RotatingText
                                    texts={['doer', 'builder', 'hustler', 'disruptor']}
                                    mainClassName="bg-rose-700 text-white px-5 py-2 inline-flex font-bold uppercase tracking-widest text-xl sm:text-2xl md:text-3xl transform -rotate-2 comic-panel comic-shadow"
                                    staggerFrom={"last"}
                                    initial={{ y: "100%", opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: "-120%", opacity: 0 }}
                                    staggerDuration={0.025}
                                    splitLevelClassName="overflow-hidden"
                                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                    rotationInterval={2500}
                                />
                            </div>
                        </h2>
                    </Reveal>

                    {/* Newspaper Clippings Grid */}
                    <RevealContainer stagger={0.15} className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Card 1: The Builder */}
                        <RevealItem
                            type="fade"
                            spring="gentle"
                            className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:-rotate-2 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative"
                        >
                            <div className="absolute -top-4 left-4 bg-blue-600 text-white border-2 border-black px-3 py-1 comic-title text-xs -rotate-2 uppercase tracking-wider">
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
                        </RevealItem>

                        {/* Card 2: The Veteran */}
                        <RevealItem
                            type="fade"
                            spring="gentle"
                            className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative md:mt-8"
                        >
                            <div className="absolute -top-4 right-4 bg-purple-600 text-white border-2 border-black px-3 py-1 comic-title text-xs rotate-2 uppercase tracking-wider">
                                FOR THE VETERAN
                            </div>
                            <div className="mt-4">
                                <h3 className="comic-title text-xl sm:text-2xl mb-3 leading-tight">
                                    YOU&apos;VE LAUNCHED BEFORE.<br />
                                    <span className="text-purple-600">YOU KNOW THE GAME.</span>
                                </h3>
                                <div className="border-l-4 border-purple-600 pl-4 mb-4">
                                    <p className="comic-body text-sm text-gray-800">
                                        But finding validated problems is brutal. <span className="font-bold bg-purple-100 px-1">The internet has gold buried</span> in millions of angry rants—if you know where to look.
                                    </p>
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                    <p className="comic-title text-lg sm:text-xl text-purple-700 leading-tight">
                                        KAI DOES THE DIGGING.<br />
                                        YOU DO THE BUILDING.
                                    </p>
                                </div>
                            </div>
                        </RevealItem>

                        {/* Card 3: The Investor */}
                        <RevealItem
                            type="fade"
                            spring="gentle"
                            className="comic-panel p-5 sm:p-6 lg:p-8 bg-white md:-rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 comic-shadow relative"
                        >
                            <div className="absolute -top-4 left-4 bg-emerald-600 text-white border-2 border-black px-3 py-1 comic-title text-xs -rotate-2 uppercase tracking-wider">
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
                        </RevealItem>
                    </RevealContainer>

                    {/* Bottom Tagline */}
                    <Reveal type="scale" delay={0.4} spring="bouncy" className="mt-10 sm:mt-16 text-center">
                        <div className="inline-block p-4 sm:p-6 comic-shadow transform -rotate-1 border-3 border-black" style={{ background: '#000' }}>
                            <p className="comic-title text-xl sm:text-2xl lg:text-3xl text-yellow-400">
                                WHILE YOU&apos;RE BRAINSTORMING,<br />
                                <span className="text-white">SOMEONE&apos;S ALREADY BUILDING YOUR IDEA.</span>
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Startup Ideas / SEO Section */}
            <section className="bg-black py-8 sm:py-10 lg:py-12 px-4 sm:px-6 relative overflow-hidden border-t-4 border-b-4 border-black">
                {/* Diagonal striping pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)' }}>
                </div>

                <motion.div
                    className="relative max-w-5xl mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.2 } }
                    }}
                >
                    <motion.div
                        className="comic-panel inline-block bg-yellow-400 p-3 sm:p-4 transform -rotate-2 mb-6 sm:mb-8 border-2 sm:border-4 border-white comic-shadow-white"
                        variants={{
                            hidden: { opacity: 0, scale: 0.8, rotate: -5 },
                            visible: { opacity: 1, scale: 1, rotate: -2 }
                        }}
                    >
                        <h2 className="comic-title text-lg sm:text-2xl md:text-3xl text-black uppercase tracking-widest">
                            ⚠️ WARNING: REALITY CHECK ⚠️
                        </h2>
                    </motion.div>

                    <motion.h2
                        className="comic-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 sm:mb-8 leading-none drop-shadow-[4px_4px_0_rgba(180,83,9,1)]"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                    >
                        LOOKING FOR YOUR NEXT<br />
                        <span className="text-yellow-400 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">MILLION DOLLAR IDEA?</span>
                    </motion.h2>
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                        <motion.div
                            className="comic-panel bg-white p-5 sm:p-6 lg:p-8 transform rotate-1 comic-shadow"
                            variants={{
                                hidden: { opacity: 0, x: -30 },
                                visible: { opacity: 1, x: 0 }
                            }}
                            whileHover={{ rotate: 0, scale: 1.02 }}
                        >
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 sm:mb-4 text-rose-700">STOP BRAINSTORMING. START LISTENING.</h3>
                            <p className="comic-body text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-black">
                                The best businesses aren&apos;t invented; they&apos;re <span className="font-bold bg-yellow-200 px-1 text-black">discovered</span>.
                                Hidden in 4.2M weekly conversations are thousands of people begging for solutions.
                            </p>
                            <p className="comic-body text-sm sm:text-base lg:text-lg text-black">
                                Your &quot;Uber for Dogs&quot; idea? No one asked for it.<br />
                                The problem Kai found yesterday? <span className="font-bold bg-black text-white px-1 mx-1">500 people are already searching for it.</span>
                            </p>
                        </motion.div>

                        <motion.div
                            className="comic-panel bg-yellow-400 p-5 sm:p-6 lg:p-8 transform -rotate-1 comic-shadow"
                            variants={{
                                hidden: { opacity: 0, x: 30 },
                                visible: { opacity: 1, x: 0 }
                            }}
                            whileHover={{ rotate: 0, scale: 1.02 }}
                        >
                            <h3 className="comic-title text-xl sm:text-2xl mb-3 sm:mb-4 text-black">WE DON&apos;T CREATE IDEAS. WE INTERCEPT THEM.</h3>
                            <p className="comic-body text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-black">
                                We don&apos;t sit in a room brainstorming &quot;cool apps&quot;. We unleash Kai to hunt for <span className="font-bold text-black border-b-2 border-black">commercial intent signals</span>.
                            </p>

                            <div className="bg-black p-3 sm:p-4 font-mono text-xs sm:text-sm text-green-400 mb-2 rounded shadow-inner border-2 border-white/20">
                                <div className="mb-1 opacity-70">
                                    &gt; SEARCHING FOR: &quot;
                                    <TypingAnimation
                                        words={[
                                            "I would pay for...",
                                            "Why doesn't this exist...",
                                            "If [company] added this..."
                                        ]}
                                        loop
                                        showCursor={true}
                                        typeSpeed={50}
                                        deleteSpeed={40}
                                        startOnView={false}
                                        className="inline"
                                    />
                                    &quot;
                                </div>
                                <p className="mt-2 text-yellow-400 font-bold animate-pulse">&gt; SIGNAL DETECTED: &quot;I&apos;d pay $50/mo right now for a tool that automates [X]&quot;</p>
                            </div>
                            <p className="comic-body text-xs text-black font-bold text-right">
                                That&apos;s not an idea. That&apos;s a lead.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div
                        className="mt-8 sm:mt-12"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                        }}
                    >
                        <p className="comic-title text-lg sm:text-xl lg:text-2xl text-white mb-4 sm:mb-6">
                            THIS IS NOT YOUR AVERAGE IDEA NEWSLETTER. THIS IS YOUR NEXT STARTUP. YOUR OPPORTUNITY.
                        </p>
                    </motion.div>
                </motion.div>
            </section>

            {/* Final CTA */}
            {!user && (
                <section id="final-cta" className="bg-gradient-to-br from-yellow-400 to-amber-400 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 halftone"></div>
                    <RevealContainer stagger={0.1} className="relative max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            {/* Left: Text Content */}
                            <div className="text-center lg:text-left">
                                <RevealItem type="fade" spring="gentle">
                                    <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 text-black">
                                        STOP GUESSING.<br />START BUILDING.
                                    </h2>
                                </RevealItem>
                                <RevealItem type="fade" spring="gentle">
                                    <p className="comic-body text-lg sm:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0 text-black">
                                        <span className="font-bold">10 validated opportunities</span> land in your inbox every Monday.
                                        No AI slop. No fake problems. Just real pain points from <span className="font-bold">the internet&apos;s digital town squares.</span>
                                    </p>
                                </RevealItem>

                                {/* Social proof badges */}
                                <RevealItem type="fade" spring="gentle">
                                    <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                            <Sparkles className="w-4 h-4" /> Every Monday
                                        </span>
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                            <Zap className="w-4 h-4" /> 100% Free
                                        </span>
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-400 comic-body text-sm font-bold border-2 border-yellow-400">
                                            <Mail className="w-4 h-4" /> No Spam
                                        </span>
                                    </div>
                                </RevealItem>
                            </div>

                            {/* Right: Subscribe Form */}
                            <RevealItem
                                type="fade"
                                spring="gentle"
                                className="comic-panel p-6 sm:p-8 bg-white comic-shadow rotate-1 hover:rotate-0 hover:scale-[1.02] transition-transform duration-300"
                            >
                                <h3 className="comic-title text-xl sm:text-2xl mb-4 text-black flex items-center gap-2">
                                    <Mail className="w-6 h-6 text-rose-700" />
                                    GET THE WEEKLY ZEROS
                                </h3>

                                {subscribeStatus === 'success' ? (
                                    <div className="text-center py-4">
                                        <div className="text-5xl mb-3">⚡</div>
                                        <h4 className="comic-title text-2xl mb-2 text-black">YOU&apos;RE IN!</h4>
                                        <p className="comic-body text-gray-700">First email drops Monday.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="space-y-4">
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
                                    ✓ 100% Free &bull; ✓ Unsubscribe anytime &bull; ✓ No spam
                                </p>
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
                                    <p className="text-sm comic-body text-gray-600">
                                        Want to vote &amp; earn badges?
                                    </p>
                                    <button
                                        onClick={() => openAuthModal()}
                                        className="mt-2 text-rose-700 font-bold comic-body hover:text-rose-900 inline-flex items-center gap-1 underline"
                                    >
                                        Create an account <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </RevealItem>
                        </div>
                    </RevealContainer>
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

// Static Generation (ISR)
export async function getStaticProps() {
    try {
        const [ideas, leaderboard] = await Promise.all([
            fetchCurrentWeekIdeas(),
            fetchLeaderboard()
        ]);

        return {
            props: {
                initialIdeas: ideas || [],
                initialLeaderboard: leaderboard || []
            },
            revalidate: 60 // Revalidate every 60 seconds
        };
    } catch (error) {
        console.error('Error in getStaticProps:', error);
        return {
            props: {
                initialIdeas: [],
                initialLeaderboard: []
            },
            revalidate: 60
        };
    }
}

export default ZerosByKaiLanding;

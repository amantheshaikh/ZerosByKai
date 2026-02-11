import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { normalizeIdea } from '@/lib/utils';
import { faqSchema, sampleIdeas, sampleWinners } from '@/data/sampleData';
import {
    fetchCurrentWeekIdeas,
    fetchLeaderboard,
    castVote,
    getUserVote
} from '@/lib/ideas';

import IdeaCarousel from '@/components/IdeaCarousel';
import Leaderboard from '@/components/Leaderboard';
import HeroSection from '@/components/sections/HeroSection';
import SignalTicker from '@/components/sections/SignalTicker';
import HowItWorks from '@/components/sections/HowItWorks';
import DesignationTiers from '@/components/sections/DesignationTiers';
import WhyKaiSection from '@/components/sections/WhyKaiSection';
import FAQSection from '@/components/sections/FAQSection';
import FinalCTA from '@/components/sections/FinalCTA';
import { TypingAnimation } from '@/components/ui/typing-animation';

const VoteConfirmation = dynamic(() => import('@/components/ui/vote-confirmation'), {
    loading: () => null,
});

const VOTE_ERROR_TIMEOUT = 5000;

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
                <title>10 Startup Ideas from Real Problems - Every Week | Zeros By Kai</title>
                <meta name="description" content="Stop brainstorming fake problems. Kai finds 10 validated startup ideas from millions of internet conversations every week. 100% Free." />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Zeros By Kai | Real Problems. Real Startup Ideas" />
                <meta property="og:description" content="Stop brainstorming. Start building. Get 10 validated startup opportunities delivered every Monday." />
                <meta property="og:url" content="https://zerosbykai.com/" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="Zeros By Kai | Real Problems. Real Startup Ideas" />
                <meta name="twitter:description" content="10 validated startup ideas. No AI slop. Just real problems." />
                <meta name="twitter:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <link rel="canonical" href="https://zerosbykai.com/" />
            </Head>

            <HeroSection />
            <SignalTicker />

            {/* Ideas Section */}
            <section id="ideas-section" className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 bg-yellow-50 overflow-x-hidden">
                <div className="max-w-6xl 2xl:max-w-7xl mx-auto">
                    <div className="text-center mb-6 sm:mb-6">
                        <div className="inline-block bg-black text-white px-4 sm:px-6 py-2 comic-title text-base sm:text-xl mb-4 transform -rotate-1">
                            FIND THE RIGHT <span className="text-yellow-400 inline-block">
                                <TypingAnimation showCursor={false} loop={true} delay={400} typeSpeed={100} deleteSpeed={100} startOnView={false}>ZER</TypingAnimation>O
                            </span>
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

            <Leaderboard winners={leaderboard || sampleWinners.map(normalizeIdea)} />
            <HowItWorks />
            <DesignationTiers />
            <WhyKaiSection />
            <FAQSection />

            {!user && (
                <FinalCTA
                    email={email}
                    setEmail={setEmail}
                    subscribeStatus={subscribeStatus}
                    subscribeError={subscribeError}
                    onSubscribe={handleSubscribe}
                    onOpenAuth={() => openAuthModal()}
                />
            )}

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

ZerosByKaiLanding.headerVariant = 'landing';

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
            revalidate: 60
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

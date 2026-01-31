import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, Brain, Rocket, Target, Sparkles, AlertTriangle, Lightbulb, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, getApiUrl } from '@/lib/auth';
import { useSubscribe } from '@/hooks/useSubscribe';
import Header from '@/components/Header';

const fadeIn = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 }
};

const slideInLeft = {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
};

const slideInRight = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
};

// Story scene image component with comic styling
const StoryImage = ({ src, alt, aspectRatio = "4/3", objectFit = "cover", className = "" }) => (
    <div
        className={`relative w-full border-4 border-black overflow-hidden comic-shadow ${className}`}
        style={{ aspectRatio }}
    >
        <Image
            src={src}
            alt={alt}
            fill
            className={`object-${objectFit}`}
            sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Corner deco */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-yellow-400 z-10" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-yellow-400 z-10" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-yellow-400 z-10" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-yellow-400 z-10" />
    </div>
);

// Comic speech bubble component
const SpeechBubble = ({ children, type = "speech", className = "" }) => {
    const baseClass = "relative p-4 sm:p-6 comic-body text-sm sm:text-base lg:text-lg";
    const typeStyles = {
        speech: "bg-white border-4 border-black rounded-lg",
        thought: "bg-blue-50 border-4 border-black rounded-full px-8",
        shout: "bg-yellow-400 border-4 border-black transform rotate-1",
        narrator: "bg-black text-yellow-400 border-4 border-yellow-400"
    };

    return (
        <div className={`${baseClass} ${typeStyles[type]} ${className}`}>
            {children}
        </div>
    );
};

export default function KaiStory() {
    const { user, session } = useAuth();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const { subscribe, status: subscribeStatus, error: subscribeError } = useSubscribe();
    const [showJoinForm, setShowJoinForm] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const success = await subscribe({ email, name });
        if (success) {
            setEmail('');
            setName('');
        }
    };

    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <Head>
                <title>The Story of Kai — How We Find Validated Startup Ideas from Reddit | ZerosByKai</title>
                <meta name="description" content="The origin story of Kai. In a world where building became trivial, finding the RIGHT startup idea became the real challenge. How Kai analyzes Reddit threads to discover validated business opportunities for entrepreneurs and indie hackers." />
                <meta name="keywords" content="startup idea story, how to find startup ideas, Reddit business ideas, validated startup opportunities, AI idea validation, indie hacker ideas" />
                <link rel="canonical" href="https://zerosbykai.com/story" />
                <meta property="og:title" content="The Story of Kai | ZerosByKai" />
                <meta property="og:description" content="When building became easy, knowing what to build became the goldmine. The origin story of Kai." />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://zerosbykai.com/story" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="The Story of Kai | ZerosByKai" />
                <meta name="twitter:description" content="When building became easy, knowing what to build became the goldmine." />
            </Head>

            {/* Header */}
            <header className="p-4 sm:p-6 border-b-4 border-black bg-white sticky top-0 z-50">
                <div className="max-w-6xl mx-auto">
                    <Header variant="story" />
                </div>
            </header>

            <main>
                {/* Cover / Title Panel */}
                <section className="relative bg-black py-16 sm:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden">
                    {/* Background action lines */}
                    <div className="absolute inset-0 opacity-20" style={{
                        background: 'repeating-conic-gradient(from 0deg, #fbbf24 0deg 5deg, transparent 5deg 30deg)'
                    }} />

                    <motion.div
                        className="relative max-w-5xl mx-auto text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-block bg-rose-700 text-white px-6 py-2 comic-title text-sm sm:text-lg mb-6 transform rotate-1 border-2 border-yellow-400">
                            ⚡ THE ORIGIN STORY ⚡
                        </div>

                        <h1 className="comic-title text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-yellow-400 mb-6 leading-none drop-shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
                            THE STORY<br />
                            OF <span className="text-white">KAI</span>
                        </h1>

                        <div className="comic-panel inline-block p-4 sm:p-6 bg-yellow-400 transform -rotate-1 mt-4 border-4 border-white">
                            <p className="comic-body text-base sm:text-xl lg:text-2xl text-black font-bold">
                                When building became easy...<br />
                                <span className="text-rose-700">finding what to build became the war.</span>
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Prologue - The Golden Age */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                    <div className="absolute inset-0 halftone" />

                    <div className="relative max-w-6xl mx-auto">
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="text-center mb-10"
                        >
                            <div className="inline-block bg-black text-yellow-400 px-6 py-2 comic-title text-lg sm:text-2xl mb-4 transform -rotate-1">
                                PROLOGUE
                            </div>
                            <h2 className="comic-title text-3xl sm:text-5xl lg:text-6xl text-black">
                                THE GOLDEN AGE OF <span className="text-rose-700">VIBE CODERS</span>
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInLeft}
                            >
                                <StoryImage
                                    src="/story-scene-1.jpg"
                                    alt="Scene 1: The Golden Age of Vibe Coders - Kai coding with magic bursting from his laptop"
                                    aspectRatio="9/13"
                                />
                            </motion.div>

                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInRight}
                                className="space-y-6"
                            >
                                <SpeechBubble type="narrator">
                                    <p className="comic-title text-lg sm:text-xl">THE YEAR WAS 2025...</p>
                                </SpeechBubble>

                                <div className="comic-panel p-6 bg-white comic-shadow">
                                    <p className="comic-body text-base sm:text-lg text-gray-900 leading-relaxed">
                                        The <span className="font-bold bg-yellow-200 px-1">Synthetics</span> had commoditized the craft.
                                        Code became cheap. Shipping became instant. What once took months now took minutes.
                                    </p>
                                </div>

                                <SpeechBubble type="shout">
                                    <p className="text-black font-bold flex items-center gap-2">
                                        <Rocket className="w-5 h-5" />
                                        &quot;SHIP IN 5 MINUTES!&quot; they screamed. &quot;ANYONE CAN BUILD!&quot;
                                    </p>
                                </SpeechBubble>

                                <div className="comic-panel p-6 sm:p-8 bg-white comic-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Zap className="w-8 h-8 text-yellow-500" />
                                        <p className="comic-title text-xl sm:text-2xl text-gray-900">THE NEW REALITY</p>
                                    </div>
                                    <ul className="comic-body text-sm sm:text-base space-y-3 text-gray-900">
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 text-xl">✓</span>
                                            <span><strong>Landing page?</strong> Done in 3 minutes.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 text-xl">✓</span>
                                            <span><strong>Full-stack app?</strong> Before lunch.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 text-xl">✓</span>
                                            <span><strong>Complex backend?</strong> Weekend project.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 text-xl">✓</span>
                                            <span><strong>Technical barriers?</strong> <span className="bg-black text-white px-2">DEMOLISHED.</span></span>
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Chapter 1 - The Builder's Trap (Merged) */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #be123c 0, #be123c 10px, transparent 10px, transparent 20px)'
                    }} />

                    <div className="relative max-w-6xl mx-auto">
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-rose-700 text-white px-6 py-2 comic-title text-lg sm:text-2xl mb-4 border-2 border-yellow-400">
                                CHAPTER 1
                            </div>
                            <h2 className="comic-title text-3xl sm:text-5xl lg:text-6xl text-yellow-400">
                                THE BUILDER&apos;S <span className="text-white">TRAP</span>
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInLeft}
                                className="space-y-6 order-2 lg:order-1"
                            >
                                <SpeechBubble type="thought" className="bg-gray-800 border-gray-600 text-gray-300">
                                    <p className="italic">
                                        &quot;I can build ANYTHING now... but what should I build?&quot;
                                    </p>
                                </SpeechBubble>

                                <div className="p-6 bg-white border-4 border-yellow-400 rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Brain className="w-6 h-6 text-rose-600" />
                                        <p className="comic-title text-lg text-rose-600">ANALYSIS PARALYSIS</p>
                                    </div>
                                    <p className="comic-body text-gray-800 leading-relaxed">
                                        Builders stared at blank screens, frozen by <span className="text-yellow-600 font-bold">infinite choice</span>.
                                        Desperate to ship, they made the fatal mistake:
                                    </p>
                                </div>

                                <div className="p-6 bg-white border-4 border-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                        <p className="comic-title text-lg text-yellow-600">THE MISTAKE</p>
                                    </div>
                                    <p className="comic-body text-gray-800 leading-relaxed">
                                        Building from <span className="text-rose-600 font-bold">imagination</span> instead of
                                        <span className="text-green-600 font-bold"> validation</span>.
                                        &quot;What if&quot; became &quot;ship it.&quot;
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInRight}
                                className="order-1 lg:order-2"
                            >
                                <StoryImage
                                    src="/story-scene-2.jpg"
                                    alt="Scene 2: The Graveyard of Ideas - Kai overwhelmed by bad startup ideas like Uber for Dogs and Crypto Pets"
                                    aspectRatio="16/9"
                                />
                            </motion.div>
                        </div>

                        {/* Stats Row */}
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="space-y-8 max-w-4xl mx-auto"
                        >
                            <div className="grid sm:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-white border-4 border-rose-500 rounded-lg">
                                    <p className="comic-title text-3xl text-rose-600 mb-2">90%</p>
                                    <p className="comic-body text-xs text-gray-600">STARTUPS FAILED</p>
                                </div>
                                <div className="p-4 bg-white border-4 border-rose-500 rounded-lg">
                                    <p className="comic-title text-3xl text-rose-600 mb-2">$$$</p>
                                    <p className="comic-body text-xs text-gray-600">BURNED ON BAD IDEAS</p>
                                </div>
                                <div className="p-4 bg-white border-4 border-rose-500 rounded-lg">
                                    <p className="comic-title text-3xl text-rose-600 mb-2">∞</p>
                                    <p className="comic-body text-xs text-gray-600">HOURS WASTED</p>
                                </div>
                            </div>

                            <SpeechBubble type="shout" className="bg-yellow-400 border-rose-500 text-center transform rotate-1">
                                <p className="text-rose-900 comic-title text-lg sm:text-xl">
                                    &quot;UBER FOR DOGS&quot; • &quot;TINDER FOR PLANTS&quot; • &quot;WRAPPER #9000&quot;
                                    <br />
                                    <span className="text-black font-bold">ALL DEAD. ALL FORGOTTEN.</span>
                                </p>
                            </SpeechBubble>
                        </motion.div>
                    </div>
                </section>

                {/* Chapter 2 - The Discovery */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
                    {/* Stars effect */}
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }} />

                    <div className="relative max-w-6xl mx-auto">
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-blue-600 text-white px-6 py-2 comic-title text-lg sm:text-2xl mb-4 border-2 border-yellow-400">
                                CHAPTER 2
                            </div>
                            <h2 className="comic-title text-3xl sm:text-5xl lg:text-6xl text-yellow-400">
                                THE <span className="text-white">DISCOVERY</span>
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInLeft}
                            >
                                <StoryImage
                                    src="/story-scene-3.jpg"
                                    alt="Scene 3: The Discovery - Kai finding 'Only If This Existed' in Reddit threads with his magnifying glass"
                                    aspectRatio="4/3"
                                />
                            </motion.div>

                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInRight}
                                className="space-y-6"
                            >
                                <SpeechBubble type="narrator">
                                    <p className="comic-title text-lg">
                                        <Lightbulb className="inline w-5 h-5 text-yellow-400 mr-2" />
                                        THE TRUTH WAS ALWAYS THERE...
                                    </p>
                                </SpeechBubble>

                                <div className="p-6 bg-white border-4 border-blue-600 rounded-lg">
                                    <p className="comic-body text-base sm:text-lg text-gray-800 leading-relaxed">
                                        Hidden in plain sight. Buried in <span className="text-yellow-600 font-bold">Reddit threads</span>.
                                        Scattered across forums. Real humans, screaming about real problems.
                                        <br /><br />
                                        <span className="text-gray-900 font-bold">&quot;I would PAY for this...&quot;</span>
                                        <br />
                                        <span className="text-gray-900 font-bold">&quot;Why doesn&apos;t this exist?&quot;</span>
                                        <br />
                                        <span className="text-gray-900 font-bold">&quot;Someone PLEASE build this!&quot;</span>
                                    </p>
                                </div>

                                <SpeechBubble type="thought" className="bg-blue-900 border-blue-400 text-blue-200">
                                    <p className="italic">
                                        The problem was never the building.<br />
                                        It was knowing <span className="text-yellow-400 font-bold">which pain to cure.</span>
                                    </p>
                                </SpeechBubble>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Chapter 3 - Enter Kai */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                    <div className="absolute inset-0 halftone" />

                    {/* Impact lines background */}
                    <div className="absolute inset-0 opacity-20" style={{
                        background: 'repeating-conic-gradient(from 0deg, #000 0deg 2deg, transparent 2deg 15deg)'
                    }} />

                    <div className="relative max-w-6xl mx-auto">
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-black text-yellow-400 px-8 py-3 comic-title text-xl sm:text-3xl mb-4 transform rotate-1 border-4 border-yellow-400">
                                ⚡ CHAPTER 3 ⚡
                            </div>
                            <h2 className="comic-title text-4xl sm:text-6xl lg:text-8xl text-black drop-shadow-[4px_4px_0_rgba(255,255,255,0.5)]">
                                ENTER <span className="text-rose-700">KAI</span>
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInLeft}
                                className="order-2 lg:order-1 space-y-6"
                            >
                                <div className="p-6 bg-white comic-shadow transform -rotate-1 border-4 border-black rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Target className="w-6 h-6 text-rose-700" />
                                        <p className="comic-title text-xl text-rose-700">THE MISSION</p>
                                    </div>
                                    <p className="comic-body text-base sm:text-lg text-gray-900 leading-relaxed">
                                        Not another &quot;do-it-all&quot; coding bot.<br />
                                        Kai is a <span className="font-bold bg-yellow-200 px-1">Demand Hunter.</span> We find the bleeding neck. You sell the bandage.
                                    </p>
                                </div>

                                <SpeechBubble type="shout">
                                    <p className="text-black font-bold comic-title text-lg sm:text-xl">
                                        &quot;STOP GUESSING.<br />
                                        START <span className="bg-black text-yellow-400 px-2">SOLVING.</span>&quot;
                                    </p>
                                </SpeechBubble>

                                <div className="p-6 bg-black text-white comic-shadow border-4 border-yellow-400 rounded-lg">
                                    <p className="comic-title text-lg text-yellow-400 mb-4">THE ENGINE SPECS:</p>
                                    <ul className="comic-body space-y-2 text-sm sm:text-base text-white">
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-400">▸</span>
                                            <span className="text-white">Scans 20+ subreddits weekly</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-400">▸</span>
                                            <span className="text-white">Thousands of threads analyzed</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-400">▸</span>
                                            <span className="text-white">Extracts validated pain points</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-400">▸</span>
                                            <span className="text-white">Delivers 10 opportunities every Monday</span>
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>

                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInRight}
                                className="order-1 lg:order-2"
                            >
                                <StoryImage
                                    src="/story-scene-4.jpg"
                                    alt="Scene 4: Kai Rises - Hero shot of Kai with tablet, skyscrapers in the background"
                                    aspectRatio="2/3"
                                    className="max-w-md mx-auto"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Epilogue - The New Era */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)'
                    }} />

                    <div className="relative max-w-6xl mx-auto">
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="text-center mb-8"
                        >
                            <div className="inline-block bg-yellow-400 text-black px-6 py-2 comic-title text-lg sm:text-2xl mb-4 transform -rotate-1">
                                EPILOGUE
                            </div>
                            <h2 className="comic-title text-3xl sm:text-5xl lg:text-6xl text-white">
                                THE NEW <span className="text-yellow-400">ERA</span>
                            </h2>
                        </motion.div>

                        {/* Side-by-side Layout: Image Left, Content Right */}
                        <div className="grid lg:grid-cols-2 gap-8 items-start mb-12">
                            {/* Image on Left */}
                            <motion.div
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                variants={slideInLeft}
                            >
                                <StoryImage
                                    src="/story-scene-5.jpg"
                                    alt="Scene 5: The Future of Building - Kai pointing towards the sunrise with blueprints"
                                    aspectRatio="4/3"
                                />
                            </motion.div>

                            {/* Content on Right - Stacked Panels */}
                            <div className="space-y-6">
                                <motion.div
                                    initial="initial"
                                    whileInView="animate"
                                    viewport={{ once: true }}
                                    variants={slideInRight}
                                >
                                    <div className="comic-panel p-6 bg-gray-900 border-4 border-yellow-400">
                                        <div className="flex items-center gap-3 mb-4">
                                            <TrendingUp className="w-6 h-6 text-yellow-400" />
                                            <p className="comic-title text-lg text-yellow-400">THE TRUTH</p>
                                        </div>
                                        <p className="comic-body text-gray-300 leading-relaxed">
                                            In the age of <span className="text-yellow-400 font-bold">infinite noise</span>, the best compass beats
                                            the best <span className="text-gray-500 line-through">hammer</span>.
                                            Knowing <em>what</em> to build is the new superpower.
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial="initial"
                                    whileInView="animate"
                                    viewport={{ once: true }}
                                    variants={slideInRight}
                                    transition={{ delay: 0.2 }}
                                >
                                    <SpeechBubble type="shout" className="bg-yellow-400 text-center flex items-center justify-center p-8">
                                        <p className="text-black font-bold comic-title text-xl sm:text-2xl">
                                            FIND THE RIGHT ZERO.<br />
                                            <span className="text-rose-700">THEN ADD THE ONE.</span>
                                        </p>
                                    </SpeechBubble>
                                </motion.div>
                            </div>
                        </div>

                        {/* Final Panel */}
                        <motion.div
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="comic-panel p-8 sm:p-12 bg-gradient-to-r from-rose-700 to-rose-600 comic-shadow text-center">
                                <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                                <p className="comic-title text-2xl sm:text-4xl lg:text-5xl text-white leading-tight mb-6">
                                    THE STORY CONTINUES...<br />
                                    <span className="text-yellow-400">WITH YOU.</span>
                                </p>
                                <p className="comic-body text-lg text-rose-100 mb-8 max-w-xl mx-auto">
                                    Every Monday, Kai delivers 10 validated opportunities. Your next startup could be waiting in your inbox.
                                </p>

                                {/* Hide the Join section if user is already signed in */}
                                {!user ? (
                                    <AnimatePresence mode="wait">
                                        {!showJoinForm ? (
                                            <motion.button
                                                key="join-button"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowJoinForm(true)}
                                                className="group px-8 py-5 bg-yellow-400 text-black comic-title text-xl hover:bg-yellow-300 transition-all duration-300 comic-shadow border-4 border-black"
                                            >
                                                <span className="flex items-center gap-3">
                                                    🔥 JOIN THE HUNT
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </motion.button>
                                        ) : (
                                            <motion.div
                                                key="join-form"
                                                initial={{ opacity: 0, height: 0, y: -20 }}
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0, y: -20 }}
                                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                                className="comic-panel p-8 bg-white comic-shadow overflow-hidden max-w-xl mx-auto"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="comic-title text-2xl text-black">GET THE WEEKLY ZEROS</h3>
                                                    <button
                                                        onClick={() => setShowJoinForm(false)}
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
                                                    <Link
                                                        href="/"
                                                        className="text-rose-700 font-bold underline hover:text-rose-900"
                                                    >
                                                        Create an account &rarr;
                                                    </Link>
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="comic-panel p-8 bg-white comic-shadow max-w-xl mx-auto"
                                    >
                                        <div className="text-4xl mb-3">✓</div>
                                        <h3 className="comic-title text-2xl mb-3 text-black">
                                            YOU&apos;RE ALREADY IN{user.user_metadata?.name ? `, ${user.user_metadata.name.toUpperCase()}` : ''}!
                                        </h3>
                                        <p className="comic-body text-gray-700 mb-4">
                                            You&apos;re all set to receive the weekly zeros. Check your inbox every Monday for fresh opportunities.
                                        </p>
                                        <Link
                                            href="/"
                                            className="inline-block px-6 py-3 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-all comic-shadow"
                                        >
                                            VIEW THIS WEEK&apos;S IDEAS
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* The End */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 bg-yellow-400 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-block comic-panel p-6 sm:p-10 bg-black comic-shadow transform -rotate-1">
                            <p className="comic-title text-4xl sm:text-6xl lg:text-7xl text-yellow-400">
                                THE END
                            </p>
                            <p className="comic-body text-sm sm:text-base text-gray-400 mt-4">
                                ...or is it just the beginning?
                            </p>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 text-center comic-body text-sm">
                <p>&copy; {new Date().getFullYear()} ZerosByKai. All rights reserved.</p>
                <div className="mt-4 space-x-6">
                    <Link href="/terms" className="hover:text-yellow-400 underline">Terms</Link>
                    <Link href="/privacy" className="hover:text-yellow-400 underline">Privacy</Link>
                    <Link href="/about" className="hover:text-yellow-400 underline">About</Link>
                    <Link href="/" className="hover:text-yellow-400 underline">Home</Link>
                </div>
            </footer>
        </div>
    );
}

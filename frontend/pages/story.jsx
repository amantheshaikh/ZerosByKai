import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Brain, Rocket, Target, Sparkles, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

// --- Animation variants ---
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

// --- Shared constants ---
const DIAGONAL_STRIPES_ROSE = 'repeating-linear-gradient(45deg, #be123c 0, #be123c 10px, transparent 10px, transparent 20px)';
const DIAGONAL_STRIPES_GOLD = 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)';

// --- Data ---
const STATS = [
    { value: '90%', label: 'STARTUPS FAILED' },
    { value: '$$$', label: 'BURNED ON BAD IDEAS' },
    { value: '∞', label: 'HOURS WASTED' },
];

const STEPS = [
    { n: 1, title: 'SCRAPES THE CHAOS', body: 'Reddit. Hacker News. X. Indie Hackers. Millions of complaints, wishes, and rants analyzed every week.' },
    { n: 2, title: 'FINDS THE PATTERNS', body: 'AI clusters the pain points. "500 people angry about the same thing" = validated idea.' },
    { n: 3, title: 'DELIVERS THE ZEROS', body: '10 curated startup ideas every Monday. Not random ideas. Validated pain points waiting to be solved.' },
];

const NEW_REALITY_ITEMS = [
    { icon: '✓', text: <><strong>Landing page?</strong> Done in 3 minutes.</> },
    { icon: '✓', text: <><strong>Full-stack app?</strong> Before lunch.</> },
    { icon: '✓', text: <><strong>Complex backend?</strong> Weekend project.</> },
    { icon: '✓', text: <><strong>Technical barriers?</strong> <span className="bg-black text-white px-2">DEMOLISHED.</span></> },
];



// --- Reusable local components ---
const Reveal = ({ children, variant = fadeIn, className = "", delay = 0 }) => (
    <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={variant}
        transition={delay ? { delay } : undefined}
        className={className}
    >
        {children}
    </motion.div>
);

const ChapterHeading = ({ badge, badgeClass, title, accent, accentClass, titleClass = "" }) => (
    <Reveal className={`text-center ${badge === 'EPILOGUE' ? 'mb-8' : 'mb-12'}`}>
        <div className={`inline-block px-6 py-2 comic-title text-lg sm:text-2xl mb-4 ${badgeClass}`}>
            {badge}
        </div>
        <h2 className={`comic-title text-3xl sm:text-5xl lg:text-6xl ${titleClass}`}>
            {title} <span className={accentClass}>{accent}</span>
        </h2>
    </Reveal>
);

const StoryImage = ({ src, alt, aspectRatio = "4/3", objectFit = "cover", className = "" }) => (
    <div className={`relative w-full border-4 border-black overflow-hidden comic-shadow ${className}`} style={{ aspectRatio }}>
        <Image src={src} alt={alt} fill className={`object-${objectFit}`} sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-yellow-400 z-10" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-yellow-400 z-10" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-yellow-400 z-10" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-yellow-400 z-10" />
    </div>
);

const SpeechBubble = ({ children, type = "speech", className = "" }) => {
    const baseClass = "relative p-4 sm:p-6 comic-body text-sm sm:text-base lg:text-lg";
    const typeStyles = {
        speech: "bg-white border-4 border-black rounded-lg",
        thought: "bg-blue-50 border-4 border-black rounded-full px-8",
        shout: "bg-yellow-400 border-4 border-black transform rotate-1",
        narrator: "bg-black text-yellow-400 border-4 border-yellow-400"
    };
    return <div className={`${baseClass} ${typeStyles[type]} ${className}`}>{children}</div>;
};

const StoryStep = ({ n, title, body }) => (
    <div className="comic-panel p-6 bg-white comic-shadow">
        <div className="flex items-start gap-4">
            <div className="bg-rose-700 text-white w-10 h-10 flex items-center justify-center comic-title text-xl flex-shrink-0">{n}</div>
            <div>
                <h3 className="comic-title text-lg mb-2 text-black">{title}</h3>
                <p className="comic-body text-sm text-gray-700">{body}</p>
            </div>
        </div>
    </div>
);

const StatCard = ({ value, label }) => (
    <div className="p-4 bg-white border-4 border-rose-500 rounded-lg">
        <p className="comic-title text-3xl text-rose-600 mb-2">{value}</p>
        <p className="comic-body text-xs text-gray-600">{label}</p>
    </div>
);

const ListItem = ({ icon, iconClass, children, className = "", gap = "gap-2" }) => (
    <li className={`flex items-start ${gap} ${className}`}>
        <span className={iconClass}>{icon}</span>
        <span>{children}</span>
    </li>
);

export default function KaiStory() {
    const { user, subscribeNewsletter } = useAuth();
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState('idle');
    const [subscribeError, setSubscribeError] = useState(null);

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

    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <Head>
                <title>How Kai Finds Validated Startup Ideas: The Story | Zeros By Kai</title>
                <meta name="description" content="The origin story of Kai. In a world where building became trivial, finding the RIGHT startup idea became the real challenge. How Kai analyzes the internet's noise to discover validated business opportunities for entrepreneurs and indie hackers." />
                <meta name="keywords" content="startup idea story, how to find startup ideas, validated startup opportunities, AI idea validation, indie hacker ideas" />
                <link rel="canonical" href="https://zerosbykai.com/story" />
                <meta property="og:title" content="The Story of Kai | Zeros By Kai" />
                <meta property="og:description" content="When building became easy, knowing what to build became the goldmine. The origin story of Kai." />
                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://zerosbykai.com/story" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="The Story of Kai | Zeros By Kai" />
                <meta name="twitter:description" content="When building became easy, knowing what to build became the goldmine." />
            </Head>



            <main>
                {/* Cover / Title Panel */}
                <section className="relative bg-black pt-32 pb-16 sm:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-conic-gradient(from 0deg, #fbbf24 0deg 5deg, transparent 5deg 30deg)' }} />
                    <motion.div className="relative max-w-5xl 2xl:max-w-7xl mx-auto text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                        <div className="inline-block bg-rose-700 text-white px-6 py-2 comic-title text-sm sm:text-lg mb-6 transform rotate-1 border-2 border-yellow-400">
                            ⚡ THE ORIGIN STORY ⚡
                        </div>
                        <h1 className="comic-title text-4xl sm:text-7xl md:text-8xl lg:text-9xl text-yellow-400 mb-6 leading-none drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
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
                    <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                        <ChapterHeading badge="PROLOGUE" badgeClass="bg-black text-yellow-400 transform -rotate-1" title="THE GOLDEN AGE OF" accent="VIBE CODERS" accentClass="text-rose-700" titleClass="text-black" />

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <Reveal variant={slideInLeft}>
                                <StoryImage src="/story-scene-1.jpg" alt="Scene 1: The Golden Age of Vibe Coders - Kai coding with magic bursting from his laptop" aspectRatio="9/13" />
                            </Reveal>

                            <Reveal variant={slideInRight} className="space-y-6">
                                <SpeechBubble type="narrator">
                                    <p className="comic-title text-lg sm:text-xl">THE YEAR WAS 2025...</p>
                                </SpeechBubble>

                                <div className="comic-panel p-6 bg-white comic-shadow">
                                    <p className="comic-body text-base sm:text-lg text-gray-900 leading-relaxed">
                                        <span className="font-bold bg-yellow-200 px-1">AI Agents</span> had commoditized the craft.
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
                                        {NEW_REALITY_ITEMS.map((item, i) => (
                                            <ListItem key={i} icon={item.icon} iconClass="text-green-600 text-xl" gap="gap-3">{item.text}</ListItem>
                                        ))}
                                    </ul>
                                    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
                                        <p className="comic-title text-base sm:text-lg text-center text-rose-700">EXECUTION IS NO LONGER THE MOAT</p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>


                    </div>
                </section>



                {/* Chapter 1 - The Builder's Trap */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: DIAGONAL_STRIPES_ROSE }} />
                    <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                        <ChapterHeading badge="CHAPTER 1" badgeClass="bg-rose-700 text-white border-2 border-yellow-400" title="THE BUILDER&apos;S" accent="TRAP" accentClass="text-white" titleClass="text-yellow-400" />

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <Reveal variant={slideInLeft} className="space-y-6 order-2 lg:order-1">
                                <SpeechBubble type="thought" className="bg-gray-800 border-gray-600 text-gray-300">
                                    <p className="italic">&quot;I can build ANYTHING now... but what should I build?&quot;</p>
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
                            </Reveal>

                            <Reveal variant={slideInRight} className="order-1 lg:order-2">
                                <StoryImage src="/story-scene-2.jpg" alt="Scene 2: The Graveyard of Ideas - Kai overwhelmed by bad startup ideas like Uber for Dogs and Crypto Pets" aspectRatio="16/9" />
                            </Reveal>
                        </div>

                        <Reveal className="space-y-8 max-w-4xl mx-auto">
                            <div className="grid sm:grid-cols-3 gap-4 text-center">
                                {STATS.map((s) => <StatCard key={s.label} {...s} />)}
                            </div>
                            <SpeechBubble type="shout" className="bg-yellow-400 border-rose-500 text-center transform rotate-1">
                                <p className="text-rose-900 comic-title text-lg sm:text-xl">
                                    &quot;UBER FOR DOGS&quot; • &quot;TINDER FOR PLANTS&quot; • &quot;INSTAGRAM FOR BOTS&quot;
                                    <br /><span className="text-black font-bold">ALL DEAD. ALL FORGOTTEN.</span>
                                </p>
                            </SpeechBubble>
                        </Reveal>
                    </div>
                </section>

                {/* Chapter 2 - The Discovery */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                        <ChapterHeading badge="CHAPTER 2" badgeClass="bg-blue-600 text-white border-2 border-yellow-400" title="THE" accent="DISCOVERY" accentClass="text-white" titleClass="text-yellow-400" />

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <Reveal variant={slideInLeft}>
                                <StoryImage src="/story-scene-3.jpg" alt="Scene 3: The Discovery - Kai finding 'Only If This Existed' in Reddit threads with his magnifying glass" />
                            </Reveal>

                            <Reveal variant={slideInRight} className="space-y-6">
                                <SpeechBubble type="narrator">
                                    <p className="comic-title text-lg">
                                        <Lightbulb className="inline w-5 h-5 text-yellow-400 mr-2" />
                                        THE TRUTH WAS ALWAYS THERE...
                                    </p>
                                </SpeechBubble>

                                <div className="p-6 bg-white border-4 border-blue-600 rounded-lg">
                                    <p className="comic-body text-base sm:text-lg text-gray-800 leading-relaxed">
                                        Hidden in plain sight. Buried in <span className="text-yellow-600 font-bold">forums and feeds</span>.
                                        Scattered across threads. Real humans, screaming about real problems.
                                        <br /><br />
                                        <span className="text-gray-900 font-bold">&quot;I would PAY for this...&quot;</span><br />
                                        <span className="text-gray-900 font-bold">&quot;Why doesn&apos;t this exist?&quot;</span><br />
                                        <span className="text-gray-900 font-bold">&quot;Someone PLEASE build this!&quot;</span>
                                    </p>
                                </div>

                                <SpeechBubble type="thought" className="bg-blue-900 border-blue-400 text-blue-200">
                                    <p className="italic">
                                        The problem was never the building.<br />
                                        It was knowing <span className="text-yellow-400 font-bold">which pain to cure.</span>
                                    </p>
                                </SpeechBubble>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* Chapter 3 - Enter Kai */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                    <div className="absolute inset-0 halftone" />
                    <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-conic-gradient(from 0deg, #000 0deg 2deg, transparent 2deg 15deg)' }} />
                    <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                        <Reveal className="text-center mb-12">
                            <div className="inline-block bg-black text-yellow-400 px-8 py-3 comic-title text-xl sm:text-3xl mb-4 transform rotate-1 border-4 border-yellow-400">
                                ⚡ CHAPTER 3 ⚡
                            </div>
                            <h2 className="comic-title text-4xl sm:text-6xl lg:text-8xl text-black drop-shadow-[2px_2px_0_rgba(255,255,255,0.5)]">
                                ENTER <span className="text-rose-700">KAI</span>
                            </h2>
                        </Reveal>

                        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
                            <Reveal variant={slideInLeft} className="order-2 lg:order-1 space-y-8">
                                <div className="p-6 bg-white comic-shadow transform -rotate-1 border-4 border-black rounded-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Target className="w-6 h-6 text-rose-700" />
                                        <p className="comic-title text-xl text-rose-700">THE MISSION</p>
                                    </div>
                                    <p className="comic-body text-base sm:text-lg text-gray-900 leading-relaxed">
                                        Hunt real startup ideas for you while you sleep.
                                    </p>
                                </div>

                                <div>
                                    <div className="inline-block bg-black text-white px-4 py-1 comic-title text-lg mb-4 transform rotate-1">
                                        THE PROTOCOL
                                    </div>
                                    <div className="space-y-6">
                                        {STEPS.map((step) => <StoryStep key={step.n} {...step} />)}
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal variant={slideInRight} className="order-1 lg:order-2 relative">
                                <div className="relative">
                                    <StoryImage src="/story-scene-4.jpg" alt="Scene 4: Kai Rises - Hero shot of Kai with tablet, skyscrapers in the background" aspectRatio="2/3" className="max-w-md mx-auto" />

                                    <div className="absolute top-0 -right-4 sm:-right-8 z-10 w-48 sm:w-64 transform rotate-3">
                                        <SpeechBubble type="shout" className="text-center shadow-xl">
                                            <p className="text-rose-900 font-bold comic-title text-sm sm:text-lg leading-tight">
                                                &quot;STOP GUESSING.<br />
                                                START <span className="bg-black text-yellow-400 px-1">SOLVING.</span>&quot;
                                            </p>
                                        </SpeechBubble>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* Epilogue - The New Era */}
                {/* Quote / Bottleneck Section (Moved) */}
                <section className="py-12 sm:py-16 px-6 bg-gray-900 border-t-8 border-b-8 border-yellow-400 relative z-10">
                    <div className="max-w-4xl 2xl:max-w-6xl mx-auto text-center">
                        <Reveal>
                            <p className="comic-title text-2xl sm:text-4xl lg:text-5xl text-yellow-400 leading-tight mb-6 px-4">
                                &quot;THE BOTTLENECK HAS SHIFTED.&quot;
                            </p>
                            <p className="comic-body text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                                We conquered the code. We mastered the deploy. But we forgot one thing:
                                <br /><br />
                                <span className="text-white font-bold bg-rose-700 px-2 py-1 transform rotate-1 inline-block">THE PURPOSE.</span>
                            </p>
                            <div className="mt-8 pt-6 border-t border-gray-700">
                                <p className="comic-body text-lg text-white">
                                    Kai isn&apos;t another AI agent who builds for you.<br />
                                    <strong>Kai finds the reason for you to build.</strong>
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* Epilogue - The New Era */}
                <section className="py-12 sm:py-20 px-4 sm:px-6 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: DIAGONAL_STRIPES_GOLD }} />
                    <div className="relative max-w-6xl 2xl:max-w-7xl mx-auto">
                        <ChapterHeading badge="EPILOGUE" badgeClass="bg-yellow-400 text-black transform -rotate-1" title="THE NEW" accent="ERA" accentClass="text-yellow-400" titleClass="text-white" />

                        <div className="grid lg:grid-cols-2 gap-8 items-start mb-12">
                            <Reveal variant={slideInLeft}>
                                <StoryImage src="/story-scene-5.jpg" alt="Scene 5: The Future of Building - Kai pointing towards the sunrise with blueprints" />
                            </Reveal>

                            <div className="space-y-6">
                                <Reveal variant={slideInRight}>
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
                                </Reveal>

                                <Reveal variant={slideInRight} delay={0.2}>
                                    <SpeechBubble type="shout" className="bg-yellow-400 text-center flex items-center justify-center p-8">
                                        <p className="text-black font-bold comic-title text-xl sm:text-2xl">
                                            FIND THE RIGHT ZERO.<br />
                                            <span className="text-rose-700">THEN ADD THE ONE.</span>
                                        </p>
                                    </SpeechBubble>
                                </Reveal>
                            </div>
                        </div>

                        {/* Final Panel */}
                        <Reveal className="max-w-6xl 2xl:max-w-7xl mx-auto">
                            <div className="comic-panel p-8 sm:p-12 bg-gradient-to-r from-rose-700 to-rose-600 comic-shadow">
                                <div className="grid lg:grid-cols-2 gap-8 items-center">
                                    {/* Left Column: Text */}
                                    <div className="text-center lg:text-left">
                                        <div className="inline-block">
                                            <Sparkles className="w-12 h-12 text-yellow-400 mb-6 mx-auto lg:mx-0" />
                                        </div>
                                        <p className="comic-title text-2xl sm:text-4xl lg:text-5xl text-white leading-[1.1] mb-6">
                                            THE STORY CONTINUES...<br /><span className="text-yellow-400">WITH YOU.</span>
                                        </p>
                                        <p className="comic-body text-lg text-rose-100 mb-8 max-w-xl mx-auto lg:mx-0">
                                            Every Monday, Kai delivers 10 validated opportunities. Your next startup could be waiting in your inbox.
                                        </p>
                                    </div>

                                    {/* Right Column: Form */}
                                    <div>
                                        {!user ? (
                                            <div className="relative">
                                                <div className="comic-panel p-8 bg-white comic-shadow overflow-hidden max-w-xl mx-auto">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="comic-title text-2xl text-black">GET THE WEEKLY ZEROS</h3>
                                                    </div>
                                                    {subscribeStatus === 'success' ? (
                                                        <div className="text-center py-2">
                                                            <div className="text-4xl mb-3">⚡</div>
                                                            <h4 className="comic-title text-xl mb-2 text-black">YOU&apos;RE IN!</h4>
                                                            <p className="comic-body text-gray-700">First email drops Monday.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full">
                                                            <form onSubmit={handleSubscribe} className="space-y-4">
                                                                <input
                                                                    type="email"
                                                                    value={email}
                                                                    onChange={(e) => setEmail(e.target.value)}
                                                                    placeholder="your@email.com"
                                                                    className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                                                                    required
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={subscribeStatus === 'loading'}
                                                                    className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50"
                                                                >
                                                                    {subscribeStatus === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE FREE'}
                                                                </button>
                                                            </form>
                                                            {subscribeStatus === 'error' && (
                                                                <div className="mt-3 bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm text-left">
                                                                    {subscribeError}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-xs comic-body mt-3 text-gray-600">✓ Free forever &bull; ✓ Unsubscribe anytime &bull; ✓ No spam</p>
                                                    <p className="text-xs comic-body mt-2 text-gray-500">
                                                        Want to vote &amp; earn badges?{' '}
                                                        <Link href="/" className="text-rose-700 font-bold underline hover:text-rose-900">Create an account &rarr;</Link>
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="comic-panel p-8 bg-white comic-shadow max-w-xl mx-auto">
                                                <div className="text-4xl mb-3">✓</div>
                                                <h3 className="comic-title text-2xl mb-3 text-black">
                                                    YOU&apos;RE ALREADY IN{user.user_metadata?.name ? `, ${user.user_metadata.name.toUpperCase()}` : ''}!
                                                </h3>
                                                <p className="comic-body text-gray-700 mb-4">
                                                    You&apos;re all set to receive the weekly zeros. Check your inbox every Monday for fresh opportunities.
                                                </p>
                                                <Link href="/" className="inline-block px-6 py-3 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-all comic-shadow">
                                                    VIEW THIS WEEK&apos;S IDEAS
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* The End */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 bg-yellow-400 text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <div className="inline-block comic-panel p-6 sm:p-10 bg-black comic-shadow transform -rotate-1">
                            <p className="comic-title text-4xl sm:text-6xl lg:text-7xl text-yellow-400">THE END</p>
                            <p className="comic-body text-sm sm:text-base text-gray-400 mt-4">...or is it just the beginning?</p>
                        </div>
                    </motion.div>
                </section>
            </main>


        </div>
    );
}

KaiStory.headerVariant = 'story';

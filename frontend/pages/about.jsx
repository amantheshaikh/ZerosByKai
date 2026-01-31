import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Cpu, Target, Brain, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.15
        }
    }
};

export default function AboutKai() {
    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <Head>
                <title>About Kai — AI Startup Idea Curator | ZerosByKai</title>
                <meta name="description" content="Meet Kai, the AI that finds validated startup ideas from Reddit. In a world where building software is easy, knowing WHAT to build is the real goldmine. Kai analyzes thousands of Reddit threads to find real business opportunities for entrepreneurs and indie hackers." />
                <meta name="keywords" content="AI startup idea finder, Reddit business ideas, startup validation tool, find what to build, AI idea curation, entrepreneur tools" />
                <link rel="canonical" href="https://zerosbykai.com/about" />
                <meta property="og:title" content="About Kai — AI Startup Idea Curator | ZerosByKai" />
                <meta property="og:description" content="Meet Kai, the AI that finds validated startup ideas from Reddit. When everyone can build, knowing what to build is the goldmine." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/about" />
                <meta property="og:image" content="https://zerosbykai.com/kai-hero.jpg" />
                <meta name="twitter:title" content="About Kai — AI Startup Idea Curator | ZerosByKai" />
                <meta name="twitter:description" content="Meet Kai, the AI that finds validated startup ideas from Reddit threads for entrepreneurs." />
            </Head>

            {/* Header */}
            <header className="p-6 border-b-4 border-black bg-white">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold hover:underline comic-body">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="comic-title text-xl tracking-widest">ZEROS BY KAI</div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 py-12 sm:py-16 lg:py-20 px-6 overflow-hidden">
                    <div className="absolute inset-0 halftone"></div>

                    <motion.div
                        className="relative max-w-5xl mx-auto"
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                    >
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            {/* Left Content */}
                            <motion.div variants={fadeIn} className="space-y-6">
                                <div className="comic-panel p-3 bg-black inline-block transform -rotate-2">
                                    <p className="comic-title text-sm text-yellow-400">⚡ THE PHILOSOPHY</p>
                                </div>

                                <h1 className="comic-title text-4xl sm:text-5xl lg:text-6xl leading-none text-gray-900">
                                    MEET <span className="text-rose-700">KAI</span>
                                </h1>

                                <div className="comic-panel p-6 bg-white border-l-8 border-black">
                                    <p className="comic-body text-lg lg:text-xl leading-relaxed text-black">
                                        In a world where <span className="font-bold bg-yellow-200 px-1">every AI agent can build</span>,
                                        the real question isn&apos;t <em>&quot;Can you ship?&quot;</em> — it&apos;s{' '}
                                        <span className="font-bold bg-rose-700 text-white px-2">&quot;What should you ship?&quot;</span>
                                    </p>
                                </div>
                            </motion.div>

                            {/* Right: Hero Image */}
                            <motion.div
                                variants={fadeIn}
                                className="relative"
                            >
                                <div className="comic-panel p-2 bg-white comic-shadow transform rotate-2">
                                    <Image
                                        src="/kai-about-hero.png"
                                        alt="Kai - AI startup idea curator finding validated business opportunities from Reddit for entrepreneurs"
                                        width={500}
                                        height={500}
                                        className="w-full h-auto border-4 border-black"
                                        priority
                                    />
                                </div>
                                <div className="absolute -bottom-4 -left-4 bg-black text-yellow-400 px-4 py-2 comic-title text-sm transform -rotate-3">
                                    🎯 YOUR IDEA DEALER
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* The New Era Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-6 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)' }}>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-yellow-400 text-black px-6 py-2 comic-title text-xl mb-6 transform rotate-1">
                                🚀 THE NEW ERA
                            </div>
                            <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl leading-tight">
                                BUILDING BECAME <span className="text-yellow-400">TRIVIAL</span>
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="comic-panel p-6 bg-white text-black transform -rotate-1"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Cpu className="w-8 h-8 text-blue-600" />
                                    <h3 className="comic-title text-xl text-blue-600">THE OLD WORLD</h3>
                                </div>
                                <ul className="comic-body space-y-3 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>Months to learn coding</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>Weeks to build an MVP</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>$50K+ to hire developers</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>Technical expertise = barrier</span>
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
                                    <p className="comic-body text-xs text-gray-500 line-through">
                                        Skills determined who could build
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="comic-panel p-6 bg-yellow-400 text-black transform rotate-1 comic-shadow"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles className="w-8 h-8 text-rose-700" />
                                    <h3 className="comic-title text-xl text-rose-700">THE NEW WORLD</h3>
                                </div>
                                <ul className="comic-body space-y-3 text-sm font-bold">
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-700">⚡</span>
                                        <span>&quot;Build me a landing page&quot; → Done in 5 mins</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-700">⚡</span>
                                        <span>AI agents write, debug, and deploy</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-700">⚡</span>
                                        <span>No-code tools for everything else</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-700">⚡</span>
                                        <span>Everyone can ship. Everyone.</span>
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                                    <p className="comic-title text-sm">
                                        EXECUTION IS NO LONGER THE MOAT
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="comic-panel p-8 bg-rose-700 text-center comic-shadow"
                        >
                            <p className="comic-title text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
                                WHEN EVERYONE CAN BUILD,<br />
                                <span className="text-yellow-400">KNOWING WHAT TO BUILD</span> IS THE GOLDMINE.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* The Problem Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-6 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-black text-yellow-400 px-6 py-2 comic-title text-xl mb-6 transform -rotate-1">
                                🤔 THE REAL PROBLEM
                            </div>
                            <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black leading-tight">
                                IDEAS ARE <span className="text-rose-700">EVERYWHERE</span><br />
                                GOOD ONES ARE <span className="bg-yellow-200 px-2">HIDDEN</span>
                            </h2>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Users className="w-8 h-8" />,
                                    title: "INFINITE NOISE",
                                    desc: "10,000+ startup ideas on Product Hunt. 99% will fail. How do you filter?",
                                    color: "bg-blue-50 border-blue-600"
                                },
                                {
                                    icon: <Brain className="w-8 h-8" />,
                                    title: "ANALYSIS PARALYSIS",
                                    desc: "You could build anything. So you build nothing. Stuck in the idea maze.",
                                    color: "bg-purple-50 border-purple-600"
                                },
                                {
                                    icon: <Target className="w-8 h-8" />,
                                    title: "VALIDATION VOID",
                                    desc: "You need proof people will pay. But surveys lie and focus groups suck.",
                                    color: "bg-rose-50 border-rose-600"
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`comic-panel p-6 ${item.color} border-l-4`}
                                >
                                    <div className="mb-3 text-gray-800">{item.icon}</div>
                                    <h3 className="comic-title text-lg mb-2 text-black">{item.title}</h3>
                                    <p className="comic-body text-sm text-gray-700">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Enter Kai Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-6 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 relative overflow-hidden">
                    <div className="absolute inset-0 halftone"></div>

                    <div className="relative max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <div className="inline-block bg-black text-yellow-400 px-6 py-2 comic-title text-xl mb-6 transform rotate-1">
                                💡 ENTER KAI
                            </div>
                            <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-black leading-tight">
                                THE AI THAT FINDS<br />
                                <span className="text-rose-700">THE RIGHT ZERO</span>
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="space-y-6"
                            >
                                <div className="comic-panel p-6 bg-white comic-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-rose-700 text-white w-10 h-10 flex items-center justify-center comic-title text-xl">1</div>
                                        <div>
                                            <h3 className="comic-title text-lg mb-2 text-black">SCRAPES THE CHAOS</h3>
                                            <p className="comic-body text-sm text-gray-700">
                                                20+ subreddits. Thousands of threads. Millions of complaints, wishes, and rants analyzed every week.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="comic-panel p-6 bg-white comic-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-rose-700 text-white w-10 h-10 flex items-center justify-center comic-title text-xl">2</div>
                                        <div>
                                            <h3 className="comic-title text-lg mb-2 text-black">FINDS THE PATTERNS</h3>
                                            <p className="comic-body text-sm text-gray-700">
                                                AI clusters the pain points. &quot;500 people angry about the same thing&quot; = validated opportunity.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="comic-panel p-6 bg-white comic-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-rose-700 text-white w-10 h-10 flex items-center justify-center comic-title text-xl">3</div>
                                        <div>
                                            <h3 className="comic-title text-lg mb-2 text-black">DELIVERS THE ZEROS</h3>
                                            <p className="comic-body text-sm text-gray-700">
                                                10 curated startup opportunities every Monday. Not random ideas. <strong>Validated pain points</strong> waiting to be solved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="comic-panel p-8 bg-black text-white comic-shadow"
                            >
                                <div className="text-center">
                                    <p className="comic-title text-2xl mb-4 text-yellow-400">THE KAI PROMISE</p>
                                    <div className="space-y-4 comic-body text-left">
                                        <p className="flex items-center gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span>Real problems from real humans</span>
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span>No AI slop or generic ideas</span>
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span>Pre-validated by community sentiment</span>
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span>Actionable, buildable, shippable</span>
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <p className="comic-body text-sm text-gray-400">
                                            Because in the age of AI builders,<br />
                                            the best compass beats the best hammer.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Quote / Philosophy Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-6 bg-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="comic-panel p-8 sm:p-12 bg-gray-900 comic-shadow"
                        >
                            <p className="comic-title text-3xl sm:text-4xl lg:text-5xl text-yellow-400 leading-tight mb-6">
                                &quot;THE BOTTLENECK SHIFTED.&quot;
                            </p>
                            <p className="comic-body text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                                Yesterday, it was <span className="text-rose-400">technical skill</span>.
                                Today, it&apos;s <span className="text-yellow-400 font-bold">knowing what&apos;s worth building</span>.
                                The tools got smarter. The question got harder.
                            </p>
                            <div className="mt-8 pt-6 border-t border-gray-700">
                                <p className="comic-body text-sm text-gray-500">
                                    Kai doesn&apos;t write your code. Kai tells you what code is worth writing.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-6 bg-rose-700">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="comic-title text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
                                READY TO FIND<br />
                                <span className="text-yellow-400">YOUR ZERO?</span>
                            </h2>
                            <p className="comic-body text-lg text-rose-100 mb-8 max-w-xl mx-auto">
                                Join the builders who get curated startup opportunities delivered every Monday.
                            </p>
                            <Link
                                href="/"
                                className="inline-block px-8 py-4 bg-yellow-400 text-black comic-title text-xl hover:bg-yellow-300 transition-colors comic-shadow border-4 border-black"
                            >
                                🔥 GET STARTED FREE
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 text-center comic-body text-sm">
                <p>&copy; {new Date().getFullYear()} ZerosByKai. All rights reserved.</p>
                <div className="mt-4 space-x-6">
                    <Link href="/terms" className="hover:text-yellow-400 underline">Terms</Link>
                    <Link href="/privacy" className="hover:text-yellow-400 underline">Privacy</Link>
                    <Link href="/story" className="hover:text-yellow-400 underline">Story</Link>
                    <Link href="/" className="hover:text-yellow-400 underline">Home</Link>
                </div>
            </footer>
        </div>
    );
}

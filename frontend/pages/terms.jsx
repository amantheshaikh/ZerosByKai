import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
    return (
        <div className="min-h-screen bg-yellow-50 font-sans">
            <Head>
                <title>Terms & Guidelines — Startup Ideas Curation Policy | ZerosByKai</title>
                <meta name="description" content="ZerosByKai terms and guidelines. Learn how we curate validated startup ideas from Reddit, our anti-hallucination pledge, and our 0% equity policy on business ideas you build." />
                <meta name="keywords" content="ZerosByKai terms, startup ideas policy, Reddit curation guidelines, business ideas terms of service" />
                <meta property="og:title" content="Terms & Guidelines | ZerosByKai" />
                <meta property="og:description" content="How we curate startup ideas from Reddit. Anti-hallucination pledge and 0% equity policy." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://zerosbykai.com/terms" />
                <meta name="twitter:title" content="Terms & Guidelines | ZerosByKai" />
                <link rel="canonical" href="https://zerosbykai.com/terms" />
            </Head>

            <header className="p-6 border-b-4 border-black bg-white">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="comic-title text-xl tracking-widest">ZEROS BY KAI</div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="comic-title text-5xl mb-4 text-black">TERMS & GUIDELINES</h1>
                    {/* Fixed badge: removed comic-panel to avoid white background override */}
                    <div className="inline-block bg-black text-white px-6 py-2 transform -rotate-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                        <p className="comic-body font-bold text-lg">HOW WE OPERATE</p>
                    </div>
                </div>

                {/* Master List of Subreddits */}
                <div className="comic-panel p-8 bg-white mb-12 comic-shadow relative">
                    <div className="absolute -top-4 -left-4 bg-yellow-400 border-4 border-black px-4 py-2 comic-title transform -rotate-1">
                        THE SOURCES
                    </div>
                    <h2 className="comic-title text-2xl mb-6 text-black">MASTER LIST OF SUBREDDITS</h2>
                    <p className="comic-body text-gray-800 mb-6 font-bold">
                        We don&apos;t just browse random corners of the internet. We have deep monitoring on these high-signal communities:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            "r/Business_Ideas", "r/SaaS", "r/webdev", "r/SideProject",
                            "r/smallbusiness", "r/roastmystartup", "r/GrowthHacking",
                            "r/indiehackers", "r/startups", "r/nocode", "r/vibecoding",
                            "r/Entrepreneur", "r/InternetIsBeautiful", "r/startup",
                            "r/ProductHunters", "r/StartUpIndia", "r/Startup_Ideas"
                        ].map((sub, i) => (
                            <span key={i} className="comic-body text-sm font-bold px-3 py-1 bg-gray-100 border-2 border-black text-black hover:bg-yellow-200 transition-colors cursor-default">
                                {sub}
                            </span>
                        ))}
                    </div>
                    <div className="mt-6 flex gap-4 items-center">
                        <div className="text-3xl">⚖️</div>
                        <p className="comic-body text-black font-bold">
                            This content represents our analysis and is <strong>not endorsed by Reddit</strong> or the original posters.
                        </p>
                    </div>
                </div>

                {/* Creative Clauses Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Anti-Hallucination Pledge */}
                    <div className="comic-panel p-6 bg-blue-50 comic-shadow transform rotate-1">
                        <div className="text-3xl mb-3">🤖</div>
                        <h3 className="comic-title text-xl mb-3 text-black">THE ANTI-HALLUCINATION PLEDGE</h3>
                        <p className="comic-body text-sm text-black">
                            We use AI to <span className="font-bold underline">find</span> and <span className="font-bold underline">sort</span> data, never to invent it.
                            We don&apos;t dream up fake problems. If we say &quot;people hate X&quot;, it&apos;s because actual humans posted about hating X.
                        </p>
                    </div>

                    {/* Ownership Clause */}
                    <div className="comic-panel p-6 bg-rose-50 comic-shadow transform -rotate-1">
                        <div className="text-3xl mb-3">🤝</div>
                        <h3 className="comic-title text-xl mb-3 text-black">YOU BUILD IT, YOU OWN IT</h3>
                        <p className="comic-body text-sm text-black">
                            We provide the spark (the zero). You build the fire (the one).
                            ZerosByKai claims <span className="font-bold underline">0% equity</span> and <span className="font-bold underline">0% royalties</span> on any business you build from our leads.
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="comic-panel p-6 bg-yellow-100 mb-12 border-l-8 border-black">
                    <h3 className="comic-title text-xl mb-2 text-black">⚠️ NOT FINANCIAL ADVICE</h3>
                    <p className="comic-body text-sm text-black">
                        We are idea hunters, not financial advisors. We identify signals and demand, but execution is 100% on you.
                        Don&apos;t sue us if your startup fails (and please don&apos;t forget us when you become a unicorn).
                    </p>
                </div>

            </main>

            <footer className="bg-gray-900 text-white py-8 text-center comic-body text-sm">
                <p>&copy; {new Date().getFullYear()} ZerosByKai. All rights reserved.</p>
                <div className="mt-4 space-x-6">
                    <Link href="/privacy" className="hover:text-yellow-400 underline">Privacy</Link>
                    <Link href="/story" className="hover:text-yellow-400 underline">Story</Link>
                    <Link href="/" className="hover:text-yellow-400 underline">Home</Link>
                </div>
            </footer>
        </div>
    );
}

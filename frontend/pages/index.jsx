import React, { useState } from 'react';
import { ArrowRight, Mail, TrendingUp, Users, Award, Zap } from 'lucide-react';

const ZerosByKaiLanding = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            alert(`Welcome aboard, ${name}! Check your email for the magic link.`);
            setEmail('');
            setName('');
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sample ideas for preview
    const featuredIdeas = [
        {
            id: 1,
            name: "WasteSense",
            title: "Smart Waste Segregation for Mumbai Apartments",
            tag: "🇮🇳 India",
            category: "CleanTech",
            problem: "Apartment complexes pay ₹50K+ monthly in BMC fines because residents don't know how to segregate waste properly.",
            solution: "Smart bins with AI vision that flag incorrect disposal + gamified education app + society compliance dashboards.",
            target: "Housing societies in Mumbai, Bangalore, Delhi with 100+ units. 50M+ apartment dwellers.",
            why: "BMC fines doubled in 2025. Central govt mandating segregation pan-India by 2027. ₹2,000Cr+ market."
        },
        {
            id: 2,
            name: "PrepAI",
            title: "AI Meeting Prep Assistant for Sales Teams",
            tag: "🌍 Global",
            category: "B2B SaaS",
            problem: "Sales reps waste 2-3 hours researching each prospect (LinkedIn, news, CRM) - that's 30% of their workday.",
            solution: "AI auto-generates 5-min briefing: prospect timeline, company challenges, relevant case studies, objection scripts.",
            target: "B2B sales teams at mid-market companies (50-500 employees). 15M+ sales reps globally.",
            why: "Could increase selling time by 25%. $50B+ productivity gain across B2B sales industry."
        },
        {
            id: 3,
            name: "QuickCart",
            title: "10-Minute Hyperlocal Grocery Delivery",
            tag: "🌍 Global",
            category: "Consumer",
            problem: "People forget essential items (milk, eggs, formula) and need them NOW. Current delivery: 30-60 min minimum.",
            solution: "Micro dark stores (200 sq ft) in every neighborhood. Top 500 SKUs. Two-wheeler fleet. <10 min delivery.",
            target: "Urban families in dense neighborhoods. 40% of grocery purchases are emergency/top-up items.",
            why: "$500B global grocery market. Dark stores + bikes = profitable at 500 orders/day. Proven by Zepto/Getir."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Comic book style CSS */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Courier+Prime:wght@400;700&display=swap');
        
        .comic-title {
          font-family: 'Bangers', cursive;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .comic-body {
          font-family: 'Courier Prime', monospace;
        }
        
        .halftone {
          background-image: radial-gradient(circle, #000 1px, transparent 1px);
          background-size: 8px 8px;
          opacity: 0.1;
        }
        
        .comic-border {
          border: 4px solid #000;
          box-shadow: 8px 8px 0px #000;
        }
        
        .comic-panel {
          border: 3px solid #000;
          position: relative;
          background: white;
        }
        
        .comic-shadow {
          box-shadow: 6px 6px 0px rgba(0,0,0,0.8);
        }
        
        .badge-shine {
          animation: shine 2s ease-in-out infinite;
        }
        
        @keyframes shine {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .pop-in {
          animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>

            {/* Hero Section - Yellow Background */}
            <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 overflow-hidden">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 halftone"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-12">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="comic-title text-3xl text-gray-900">ZerosByKai</div>
                        </div>
                        <button className="px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow">
                            Sign In
                        </button>
                    </header>

                    {/* Main Hero */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center py-12">
                        {/* Left: Text Content */}
                        <div className="space-y-8">
                            <div className="comic-panel p-4 bg-white inline-block">
                                <p className="comic-body text-sm font-bold">⚡ NEW IDEAS EVERY MONDAY</p>
                            </div>

                            <h1 className="comic-title text-6xl md:text-7xl lg:text-8xl leading-none text-gray-900">
                                FIND THE<br />
                                RIGHT <span className="text-rose-700">ZERO</span>
                            </h1>

                            <div className="comic-panel p-6 bg-white max-w-xl">
                                <p className="comic-body text-lg leading-relaxed">
                                    "In a world where building has never been easier,
                                    <span className="font-bold"> the hard part isn't 0 to 1.</span>
                                    <br />
                                    <span className="font-bold">It's finding the right 0."</span>
                                </p>
                            </div>

                            <p className="text-xl text-gray-900 comic-body max-w-xl leading-relaxed">
                                <span className="font-bold">This isn't AI-generated fluff.</span> Every week, Kai digs through
                                <span className="font-bold"> thousands of Reddit threads</span> to surface <span className="font-bold">real problems</span>
                                people won't shut up about. <span className="font-bold">Real opportunities.</span> No BS. No trend-chasing.
                                Just validated pain points waiting to be solved.
                            </p>
                            <p className="text-lg text-gray-900 comic-body max-w-xl mt-4">
                                For the <span className="font-bold">doers</span>. The <span className="font-bold">hustlers</span>.
                                The <span className="font-bold">builders</span> who actually ship.
                            </p>

                            {/* CTA Form */}
                            <div className="comic-panel p-8 bg-white max-w-xl comic-shadow">
                                <h3 className="comic-title text-2xl mb-4">GET THE WEEKLY REPORT</h3>
                                <form onSubmit={handleSubscribe} className="space-y-4">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400"
                                        required
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'JOINING...' : 'JOIN 547+ FOUNDERS'}
                                    </button>
                                </form>
                                <p className="text-xs comic-body mt-3 text-gray-600">
                                    ✓ Free forever • ✓ Unsubscribe anytime • ✓ No spam
                                </p>
                            </div>
                        </div>

                        {/* Right: Kai Character */}
                        <div className="relative float">
                            <div className="comic-panel comic-shadow p-2 bg-gradient-to-br from-yellow-200 to-yellow-100 rotate-2">
                                <img
                                    src="/kai-hero.jpg"
                                    alt="Kai - Opportunity Analyst"
                                    className="w-full h-auto border-4 border-black"
                                    style={{
                                        filter: 'contrast(1.1) brightness(1.05)',
                                    }}
                                />
                            </div>

                            {/* Floating badges */}
                            <div className="absolute -top-4 -left-4 comic-panel bg-white p-4 pop-in shadow-xl rotate-[-5deg]" style={{ animationDelay: '0.2s' }}>
                                <div className="text-3xl">🔍</div>
                                <p className="comic-body text-xs font-bold mt-1">2,347<br />THREADS</p>
                            </div>

                            <div className="absolute top-1/4 -right-8 comic-panel bg-white p-4 pop-in shadow-xl rotate-[5deg]" style={{ animationDelay: '0.4s' }}>
                                <div className="text-3xl">🎯</div>
                                <p className="comic-body text-xs font-bold mt-1">WINNER<br />PICKER</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Last Week's Winner Section */}
            <section className="bg-gradient-to-r from-rose-700 to-rose-600 py-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 halftone opacity-20"></div>
                <div className="relative max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Award className="w-12 h-12 text-yellow-300 transform rotate-[-10deg]" />
                        <h2 className="comic-title text-4xl text-white tracking-wide drop-shadow-md">LAST WEEK'S WINNER</h2>
                    </div>

                    <div className="comic-panel p-8 bg-white shadow-2xl transform rotate-[1deg]">
                        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                            <div className="flex-1">
                                <div className="flex gap-2 mb-4">
                                    <span className="comic-panel px-3 py-1 text-sm font-bold bg-blue-100 border-2">🇮🇳 India</span>
                                    <span className="comic-panel px-3 py-1 text-sm font-bold bg-purple-100 border-2">EdTech</span>
                                </div>
                                <h3 className="comic-title text-3xl mb-4 leading-tight">AI-Powered Resume Formatter for Government Jobs</h3>
                                <p className="comic-body text-lg leading-relaxed text-gray-800">
                                    Job seekers spend hours formatting resumes to match specific government application
                                    requirements, often getting rejected due to formatting errors rather than qualifications.
                                </p>
                                <div className="mt-6 comic-panel inline-block p-3 bg-yellow-100 border-2">
                                    <p className="comic-body text-sm text-black">
                                        <span className="font-bold">347 members</span> earned a Kai's Pick badge! 🎯
                                    </p>
                                </div>
                            </div>
                            <div className="text-center w-full md:w-auto mt-6 md:mt-0">
                                <div className="bg-black text-white p-4 comic-panel border-white border-4 transform rotate-[-3deg]">
                                    <div className="comic-title text-6xl text-yellow-400 mb-1">89</div>
                                    <div className="comic-body font-bold text-sm tracking-widest">VOTES</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* This Week's Ideas Preview */}
            <section className="py-20 px-6 bg-yellow-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-block bg-black text-white px-6 py-2 comic-title text-xl mb-4 transform -rotate-1">
                            FRESH FROM REDDIT
                        </div>
                        <h2 className="comic-title text-6xl mb-6 text-gray-900 drop-shadow-sm">THIS WEEK'S ZEROS</h2>
                        <p className="comic-body text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed border-l-4 border-yellow-400 pl-6 text-left bg-white p-4 shadow-sm">
                            <span className="font-bold">10 ideas. One vote.</span> Pick the opportunity you'd bet on.
                            If it wins, you earn a Kai's Pick badge.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10 mb-16 max-w-6xl mx-auto">
                        {featuredIdeas.map((idea, index) => (
                            <div
                                key={idea.id}
                                className="comic-panel bg-white hover:scale-[1.01] transition-all cursor-pointer comic-shadow flex flex-col h-full relative group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Top Badge */}
                                <div className="absolute -top-4 -right-4 bg-yellow-400 border-4 border-black px-4 py-1 comic-title transform rotate-3 z-10 shadow-md group-hover:rotate-6 transition-transform">
                                    IDEA #{idea.id}
                                </div>

                                <div className="p-8 flex-grow">
                                    {/* Header */}
                                    <div className="mb-6 border-b-4 border-gray-100 pb-6">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-3 py-1 text-xs font-bold bg-blue-50 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]">{idea.tag}</span>
                                            <span className="px-3 py-1 text-xs font-bold bg-purple-50 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]">{idea.category}</span>
                                        </div>
                                        <h3 className="comic-title text-3xl mb-2 leading-none">{idea.name}</h3>
                                        <h4 className="comic-body font-bold text-gray-600 text-sm bg-gray-100 inline-block px-2 py-1">{idea.title}</h4>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="space-y-5">
                                        {/* Problem */}
                                        <div className="bg-rose-50 p-4 border-2 border-black rounded-none relative">
                                            <div className="absolute -top-3 left-4 bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">The Problem</div>
                                            <p className="comic-body text-sm leading-relaxed text-gray-900">{idea.problem}</p>
                                        </div>

                                        {/* Solution */}
                                        <div className="bg-green-50 p-4 border-2 border-black rounded-none relative">
                                            <div className="absolute -top-3 left-4 bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">The Fix</div>
                                            <p className="comic-body text-sm leading-relaxed text-gray-900">{idea.solution}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="comic-body text-[10px] font-bold text-gray-500 uppercase mb-1">Target Audience</div>
                                                <p className="comic-body text-xs font-bold">{idea.target}</p>
                                            </div>
                                            <div>
                                                <div className="comic-body text-[10px] font-bold text-gray-500 uppercase mb-1">Market Potential</div>
                                                <p className="comic-body text-xs font-bold text-rose-700">{idea.why}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vote Button - At Bottom */}
                                <div className="p-4 bg-gray-50 border-t-4 border-black mt-auto">
                                    <button className="w-full relative group">
                                        <div className="w-full py-3 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors border-2 border-transparent">
                                            <span className="comic-title text-xl tracking-wider">VOTE FOR THIS</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <div className="comic-panel inline-block p-6 bg-yellow-400 comic-shadow">
                            <p className="comic-body font-bold text-lg mb-4">
                                Sign up to pick your winner and earn Kai's Pick badges
                            </p>
                            <button className="px-8 py-3 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-colors">
                                GET STARTED
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="comic-title text-5xl text-center mb-16">HOW IT WORKS</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="comic-panel p-8 bg-yellow-100 mb-6 inline-block">
                                <div className="text-6xl">📧</div>
                            </div>
                            <h3 className="comic-title text-2xl mb-3">1. GET THE REPORT</h3>
                            <p className="comic-body text-gray-700">
                                Every Monday: <span className="font-bold">10 opportunities</span> scraped from thousands of Reddit threads.
                                No fluff. No AI hallucinations. Just real problems people are screaming about.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="comic-panel p-8 bg-blue-100 mb-6 inline-block">
                                <div className="text-6xl">🎯</div>
                            </div>
                            <h3 className="comic-title text-2xl mb-3">2. PICK YOUR WINNER</h3>
                            <p className="comic-body text-gray-700">
                                <span className="font-bold">One vote. One idea.</span> Which problem would you solve?
                                Which opportunity would you bet on? Make your call.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="comic-panel p-8 bg-rose-100 mb-6 inline-block badge-shine">
                                <div className="text-6xl">🏆</div>
                            </div>
                            <h3 className="comic-title text-2xl mb-3">3. EARN YOUR BADGE</h3>
                            <p className="comic-body text-gray-700">
                                Pick the winning idea? <span className="font-bold">Kai's Pick badge unlocked.</span> Prove you've
                                got the nose for opportunities. Stack badges. Become a Diamond scout.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Badge Tiers Section */}
            <section className="py-20 px-6 bg-gray-900 text-white">
                <div className="max-w-5xl mx-auto">
                    <h2 className="comic-title text-5xl text-center mb-4 text-yellow-400">KAI'S PICK BADGES</h2>
                    <p className="comic-body text-center text-xl mb-12">
                        Sharpen your instinct. Stack badges. Prove you know what's worth building.
                    </p>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="comic-panel p-6 bg-gray-800 text-center">
                            <div className="text-5xl mb-3">🥉</div>
                            <h3 className="comic-title text-xl mb-2 text-yellow-400">BRONZE</h3>
                            <p className="comic-body text-sm text-gray-400">1-2 winning picks</p>
                        </div>
                        <div className="comic-panel p-6 bg-gray-800 text-center">
                            <div className="text-5xl mb-3">🥈</div>
                            <h3 className="comic-title text-xl mb-2 text-gray-300">SILVER</h3>
                            <p className="comic-body text-sm text-gray-400">3-5 winning picks</p>
                        </div>
                        <div className="comic-panel p-6 bg-gray-800 text-center">
                            <div className="text-5xl mb-3">🥇</div>
                            <h3 className="comic-title text-xl mb-2 text-yellow-300">GOLD</h3>
                            <p className="comic-body text-sm text-gray-400">6-10 winning picks</p>
                        </div>
                        <div className="comic-panel p-6 bg-gray-800 text-center">
                            <div className="text-5xl mb-3">💎</div>
                            <h3 className="comic-title text-xl mb-2 text-blue-300">DIAMOND</h3>
                            <p className="comic-body text-sm text-gray-400">11+ winning picks</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-br from-yellow-400 to-amber-400 py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 halftone"></div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <h2 className="comic-title text-5xl mb-6">STOP GUESSING.<br />START BUILDING.</h2>
                    <p className="comic-body text-2xl mb-8 max-w-2xl mx-auto">
                        <span className="font-bold">10 validated opportunities</span> land in your inbox every Monday.
                        No AI slop. No fake problems. Just real pain points from <span className="font-bold">thousands of Reddit threads.</span>
                    </p>
                    <div className="comic-panel p-8 bg-white max-w-lg mx-auto comic-shadow">
                        <form onSubmit={handleSubscribe} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400"
                            />
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400"
                            />
                            <button
                                type="submit"
                                className="w-full px-6 py-4 bg-black text-yellow-400 comic-title text-lg hover:bg-gray-900 transition-all comic-shadow"
                            >
                                GET STARTED
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className="comic-title text-2xl mb-4 text-yellow-400">ZEROSBYKAI</h3>
                            <p className="comic-body text-gray-400">
                                Startup opportunities from Reddit, curated by Kai every Monday.
                            </p>
                        </div>
                        <div>
                            <h4 className="comic-body font-bold mb-4">LINKS</h4>
                            <ul className="space-y-2 comic-body text-gray-400">
                                <li><a href="#" className="hover:text-yellow-400">This Week's Ideas</a></li>
                                <li><a href="#" className="hover:text-yellow-400">Archive</a></li>
                                <li><a href="#" className="hover:text-yellow-400">About Kai</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="comic-body font-bold mb-4">CONNECT</h4>
                            <ul className="space-y-2 comic-body text-gray-400">
                                <li><a href="#" className="hover:text-yellow-400">Twitter</a></li>
                                <li><a href="#" className="hover:text-yellow-400">LinkedIn</a></li>
                                <li><a href="mailto:kai@zerosbykai.com" className="hover:text-yellow-400">kai@zerosbykai.com</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center comic-body text-gray-500 text-sm">
                        <p>© 2026 ZerosByKai. Find the right zero.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ZerosByKaiLanding;

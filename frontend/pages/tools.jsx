import { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { Search, ExternalLink, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, TOOLS, CATEGORY_COLORS } from '@/lib/stash-data';
import { useSmoothScroll } from '@/lib/smoothScroll';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ_DATA = [
  {
    question: "Is it actually possible to build a SaaS for $0?",
    answer: "Yes, but let's be honest: we're not saying you can build the next $1B unicorn for free. This stash is designed to help you build an MVP, ship it fast, and validate if your idea has actual market demand. It's about moving from zero to one, not building another 'cool project' that goes nowhere."
  },
  {
    question: "Are these tools sponsored?",
    answer: "Zero. None of these tools are sponsored. Every tool in this stash is vetted from Kai's personal use. If a tool stops being great, it gets removed. Period."
  },
  {
    question: "Why not just use the big cloud providers?",
    answer: "You can, but you'll spend 50% of your time configuring infrastructure. These tools are 'PaaS' (Platform as a Service)—they handle the boring stuff so you can ship features. They are built for shipping, not just hosting."
  },
  {
    question: "What happens when I hit the free limits?",
    answer: "You celebrate. Seriously. If you exceed the generous free limits of these tools, it means you have real users. At that point, a small monthly bill is a business expense, not a burden. Don't optimize for scale you don't have yet."
  },
  {
    question: "Can I use these for commercial projects?",
    answer: "Yes. All these tools generally allow commercial use on their free tiers. They want you to build businesses on them so you'll eventually become a paying customer as you grow."
  },
  {
    question: "I'm a non-technical founder. Can I use this?",
    answer: "It will be tough, but possible. Tools like 'Windsurf' and 'Cursor' (AI editors) are bridging the gap. If you can write logic in English, modern AI coding tools can help you generate the boilerplate."
  },
  {
    question: "What is the 'Catch' with these free tools?",
    answer: "The catch is usually vendor lock-in. They make it easy to start, hoping you'll stay when you grow. The tradeoff is worth it: you save hundreds of hours of devops time in exchange for sticking to their ecosystem."
  }
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

function CategoryBadge({ category }) {
  const colors = CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs comic-title border ${colors.bg} ${colors.text} ${colors.border}`}>
      {category}
    </span>
  );
}

function CostBadge({ cost }) {
  const isFree = cost.toLowerCase().startsWith('free');
  return (
    <span className={`inline-block px-2 py-0.5 text-xs comic-title border ${isFree ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>
      {cost}
    </span>
  );
}

function ToolLogo({ url, name, className = "w-10 h-10" }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Memoize hostname to prevent recalculation
  const hostname = useMemo(() => {
    try {
      if (!url) return null;
      return new URL(url).hostname;
    } catch (e) {
      return null;
    }
  }, [url]);

  if (error || !hostname) return null;

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
      alt={`${name} logo`}
      className={`${className} rounded border-2 border-black object-contain bg-white transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
}

function ToolDetailModal({ tool, onClose }) {
  const { stop, start } = useSmoothScroll();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Stop Lenis smooth scroll and lock body
    if (stop) stop();
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      // Resume Lenis smooth scroll and unlock body
      if (start) start();
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, stop, start]);

  if (!tool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 z-[200] overflow-y-auto overscroll-contain"
      data-lenis-prevent
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="comic-panel bg-white p-4 sm:p-6 md:p-8 comic-shadow w-full max-w-2xl relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded border-2 border-black transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4 pr-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ToolLogo url={tool.url} name={tool.name} className="w-12 h-12 flex-shrink-0" />
                <h2 className="comic-title text-3xl sm:text-4xl text-black">{tool.name}</h2>
              </div>
              <p className="comic-body text-base text-gray-600 italic">&ldquo;{tool.hook}&rdquo;</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <CategoryBadge category={tool.category} />
            <CostBadge cost={tool.cost} />
          </div>

          {/* Detailed Description */}
          {tool.detailedDescription && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="comic-body text-sm text-gray-800">{tool.detailedDescription}</p>
              </div>
            </div>
          )}

          {/* What You Get */}
          <div className="mb-5">
            <p className="comic-title text-sm text-rose-700 mb-2">WHAT YOU GET</p>
            <ul className="space-y-2">
              {tool.features.map((f, i) => (
                <li key={i} className="comic-body text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold">+</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Best For */}
          {tool.bestFor && (
            <div className="mb-5 p-4 bg-green-50 border-2 border-green-300">
              <p className="comic-title text-sm text-green-800 mb-2">✓ BEST FOR</p>
              <p className="comic-body text-sm text-gray-800">{tool.bestFor}</p>
            </div>
          )}

          {/* Not Good For */}
          {tool.notGoodFor && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-300">
              <p className="comic-title text-sm text-red-800 mb-2">✗ NOT GOOD FOR</p>
              <p className="comic-body text-sm text-gray-800">{tool.notGoodFor}</p>
            </div>
          )}

          {/* Key Differentiator */}
          {tool.keyDifferentiator && (
            <div className="mb-5 p-4 bg-yellow-50 border-2 border-yellow-400">
              <p className="comic-title text-sm text-yellow-900 mb-2">⚡ KEY DIFFERENTIATOR</p>
              <p className="comic-body text-sm text-gray-800">{tool.keyDifferentiator}</p>
            </div>
          )}

          {/* Visit Button */}
          <motion.a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' }}
            whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-yellow-400 comic-title text-base border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-gray-900 transition-colors w-full justify-center"
          >
            VISIT {tool.name}
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ToolCard({ tool, index, onClick }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      onClick={onClick}
      className="comic-panel bg-white p-6 comic-shadow flex flex-col h-full cursor-pointer hover:shadow-[6px_6px_0px_0px_#000] transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <CategoryBadge category={tool.category} />
          <CostBadge cost={tool.cost} />
        </div>
        <ToolLogo url={tool.url} name={tool.name} className="w-10 h-10 flex-shrink-0" />
      </div>

      <h3 className="comic-title text-xl sm:text-2xl text-black mb-2 group-hover:text-blue-700 transition-colors">{tool.name}</h3>
      <p className="comic-body text-sm text-gray-600 italic mb-4">&ldquo;{tool.hook}&rdquo;</p>

      <div className="mb-3">
        <p className="comic-title text-xs text-rose-700 mb-1">WHAT YOU GET</p>
        <ul className="space-y-1">
          {tool.features.slice(0, 3).map((f, i) => (
            <li key={i} className="comic-body text-sm text-gray-700 flex items-start gap-2">
              <span className="text-green-600 mt-0.5 flex-shrink-0">+</span>
              {f}
            </li>
          ))}
          {tool.features.length > 3 && (
            <li className="comic-body text-xs text-gray-500 italic">+ {tool.features.length - 3} more...</li>
          )}
        </ul>
      </div>

      <div className="mb-4">
        <p className="comic-title text-xs text-blue-700 mb-1">PERFECT FOR</p>
        <p className="comic-body text-sm text-gray-700">{tool.perfectFor}</p>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <motion.a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' }}
          whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-yellow-400 comic-title text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-gray-900 transition-colors"
        >
          VISIT
          <ExternalLink className="w-3.5 h-3.5" />
        </motion.a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-black comic-title text-sm border-2 border-black hover:bg-yellow-100 transition-colors"
        >
          DEETS
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-2 border-black bg-white comic-shadow hover:shadow-[4px_4px_0px_0px_#000] transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 transition-colors"
      >
        <span className="comic-title text-base sm:text-lg text-black pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t-2 border-black bg-white">
              <p className="comic-body text-sm sm:text-base text-gray-700 mt-4 leading-relaxed">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SecretStash() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTool, setSelectedTool] = useState(null);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.hook.toLowerCase().includes(q) ||
        tool.features.some((f) => f.toLowerCase().includes(q)) ||
        tool.perfectFor.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: TOOLS.length };
    CATEGORIES.forEach((cat) => {
      counts[cat.name] = TOOLS.filter((t) => t.category === cat.name).length;
    });
    return counts;
  }, []);

  const activeCategoryInfo = useMemo(() => {
    if (activeCategory === 'all') return null;
    return CATEGORIES.find((cat) => cat.name === activeCategory);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-yellow-50">
      <Head>
        <title>Free Developer Tools & Startup Stack for MVPs (2026) | Zeros By Kai</title>
        <meta name="description" content="The ultimate list of free developer tools for 2026. Build your startup for $0 with free hosting, databases, authentication, and AI. Curated for indie hackers and solopreneurs." />
        <meta name="keywords" content={`free developer tools, mvp stack 2026, free hosting, supabase alternatives, vercel vs railway, indie hacker tools, build startup for free, ${CATEGORIES.map(c => c.name.toLowerCase()).join(', ')}`} />
        <link rel="canonical" href="https://zerosbykai.com/tools" />

        {/* Open Graph */}
        <meta property="og:title" content="Secret Stash — Build Your Startup for $0" />
        <meta property="og:description" content="Stop paying for SaaS. Here are 29+ free tools to build, launch, and scale your MVP without spending a dime. Hosting, DB, Auth, Payments, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zerosbykai.com/tools" />
        <meta property="og:site_name" content="Zeros By Kai" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Secret Stash — The $0 MVP Stack" />
        <meta name="twitter:description" content="29+ free tools for builders. Don't spend money until you make money." />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "ItemList",
                  "itemListElement": TOOLS.map((tool, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": tool.name,
                    "url": tool.url,
                    "description": tool.hook
                  }))
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": FAQ_DATA.map(item => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": item.answer
                    }
                  }))
                }
              ]
            })
          }}
        />
      </Head>



      <AnimatePresence>
        {selectedTool && (
          <ToolDetailModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
        )}
      </AnimatePresence>

      <main>
        {/* Hero */}
        <section className="relative bg-black pt-32 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, transparent 10px, transparent 20px)' }} />
          <motion.div
            className="relative max-w-4xl 2xl:max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-rose-700 text-white px-4 py-1.5 comic-title text-sm mb-4 transform rotate-1 border-2 border-yellow-400">
              FROM 0 TO 1 IN $0
            </div>
            <h1 className="comic-title text-4xl sm:text-6xl lg:text-7xl text-yellow-400 mb-4 leading-none">
              SECRET STASH
            </h1>
            <p className="comic-body text-lg sm:text-xl text-gray-300 mb-2 max-w-2xl mx-auto">
              Turn your <span className="text-rose-500">Zeros</span> into <span className="text-rose-500">Ones</span>.
            </p>
            <div className="mt-6 border-l-4 border-rose-700 pl-4 py-2 bg-white/5 max-w-xl mx-auto text-left sm:text-center sm:border-l-0 sm:pl-0">
              <p className="comic-body text-sm sm:text-lg text-gray-200 leading-relaxed">
                Building with money is easy. <span className="text-yellow-400 font-bold underline decoration-yellow-400/40">0 to 1 should not be expensive.</span>
                <br className="hidden sm:block" />
                This is the ultimate stack to launch your <span className="bg-rose-700/80 text-white px-1 font-bold">MVP without spending a dime.</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Search + Filters */}
        <section className="sticky-none z-50 bg-yellow-50 px-4 sm:px-6 py-4">
          <div className="max-w-6xl 2xl:max-w-7xl mx-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-10 pr-4 py-2 border-3 border-black comic-body text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
              />
            </div>
          </div>
        </section>

        {/* Categories (Non-sticky) */}
        <section className="bg-yellow-50 px-4 sm:px-6 py-2">
          <div className="max-w-6xl 2xl:max-w-7xl mx-auto space-y-3">
            {/* Category Chips */}
            <div className="flex flex-wrap gap-2 pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex-shrink-0 px-3 py-1.5 comic-title text-xs border-2 border-black transition-colors ${activeCategory === 'all'
                  ? 'bg-black text-yellow-400'
                  : 'bg-white text-black hover:bg-gray-100'
                  }`}
              >
                ALL ({categoryCounts.all})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex-shrink-0 px-3 py-1.5 comic-title text-xs border-2 border-black transition-colors ${activeCategory === cat.name
                    ? 'bg-black text-yellow-400'
                    : 'bg-white text-black hover:bg-gray-100'
                    }`}
                >
                  {cat.icon} {cat.name} ({categoryCounts[cat.name]})
                </button>
              ))}
            </div>

            {/* Category Description */}
            <AnimatePresence mode="wait">
              {activeCategoryInfo && (
                <motion.div
                  key={activeCategoryInfo.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-white border-2 border-black">
                    <p className="comic-body text-sm text-gray-700">
                      <span className="comic-title text-black">{activeCategoryInfo.icon} {activeCategoryInfo.name}:</span> {activeCategoryInfo.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Tool Grid */}
        <section className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-6xl 2xl:max-w-7xl mx-auto">
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredTools.map((tool, i) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    index={i}
                    onClick={() => setSelectedTool(tool)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="comic-panel inline-block p-8 bg-white comic-shadow">
                  <p className="comic-title text-2xl text-gray-400 mb-2">NO TOOLS FOUND</p>
                  <p className="comic-body text-sm text-gray-500">Try a different search or category.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 sm:px-6 py-12 bg-white border-t-4 border-black">
          <div className="max-w-3xl mx-auto">
            <h2 className="comic-title text-3xl sm:text-4xl text-black text-center mb-2">
              FREQUENTLY ASKED
            </h2>
            <p className="comic-body text-gray-500 text-center mb-10 max-w-lg mx-auto">
              Common questions about building for free.
            </p>

            <div className="flex flex-col gap-4">
              {FAQ_DATA.map((item, i) => (
                <FAQItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </section>
      </main>


    </div>
  );
}

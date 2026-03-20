import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, ArrowRight, RotateCcw, Eye, EyeOff,
  Skull, Zap, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp, Users, X
} from 'lucide-react';
import { useAuth, apiFetch } from '@/lib/auth';
import { useSmoothScroll } from '@/lib/smoothScroll';

// ─── constants ────────────────────────────────────────────────────────────────

const TIERS = [
  { min: 1, max: 2,  label: 'CONDEMNED',  emoji: '💀', accent: 'text-rose-700',  bg: 'bg-rose-50',   border: 'border-rose-700'  },
  { min: 3, max: 4,  label: 'CRITICAL',   emoji: '⚠️', accent: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' },
  { min: 5, max: 6,  label: 'MEDIOCRE',   emoji: '😐', accent: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-500' },
  { min: 7, max: 8,  label: 'PROMISING',  emoji: '📈', accent: 'text-lime-700',   bg: 'bg-lime-50',   border: 'border-lime-600'   },
  { min: 9, max: 10, label: 'SHIP IT',    emoji: '🚀', accent: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-600'  },
];

const BAR_COLORS = { 2: 'bg-rose-700', 4: 'bg-orange-500', 6: 'bg-yellow-400', 8: 'bg-lime-500' };
const ACCENT_HEADER_MAP = {
  'text-rose-700':  'text-rose-400',
  'text-blue-700':  'text-blue-300',
  'text-yellow-700':'text-yellow-400',
  'text-green-700': 'text-green-400',
};

const HOW_IT_WORKS = [
  { num: '01', title: 'SPILL YOUR GUTS',       icon: '📝', body: 'Describe your startup idea — the problem, who pays, why now. The more specific, the more surgical the roast. Vague ideas earn vague burns.' },
  { num: '02', title: 'KAI WARMS UP THE GRILL', icon: '🔥', body: "Our AI — trained on startup postmortems and years of internet chaos — tears your pitch apart line by line. No exceptions." },
  { num: '03', title: 'THE VERDICT LANDS',      icon: '💀', body: 'A score, a tier badge, surgical damage points, a competition reality check, and — buried at the bottom — one actual piece of useful advice.' },
  { num: '04', title: 'CARRY THE SHAME (OR GLORY)', icon: '🏆', body: "Share your roast publicly so other founders learn from your sacrifice. Or keep it private. We're not your therapist." },
];

const LOADING_MESSAGES = [
  'Consulting the graveyard of failed startups...',
  'Cross-referencing with every Product Hunt flop since 2011...',
  "Running the 'has anyone done this already?' scan...",
  'Calibrating the Disappointment Meter...',
  'Searching for something nice to say. Still searching.',
  'Locating your competitors. There are many.',
  'Compiling the red flags. It is a long list.',
  'Summoning the ghosts of pivots past...',
  'Stress-testing your assumptions against market reality...',
  "Checking if your domain is taken. It is.",
];

const FAQ_DATA = [
  { q: 'What exactly does the roast include?',    a: "A score from 1–10 with a tier badge (from CONDEMNED to SHIP IT), a one-line verdict, three specific problems with your idea, a competition reality check naming who's already doing it, your founder archetype, a 12-month survivability prognosis, and — buried at the end — one actually useful piece of advice. Think of it as a startup autopsy. Except you're still alive." },
  { q: 'Is this actually useful, or just mean for sport?', a: 'Both, ideally. Every section of the roast is grounded in real startup failure patterns — market saturation, vague customer definition, lack of defensibility. The "one useful thing" at the end is intentionally the most actionable output. The savagery is the delivery mechanism. The insight is the actual product.' },
  { q: 'Will Kai steal my startup idea?',          a: "Kai doesn't want your idea. If it's not in the public roast board (which you control via the toggle), it stays between you and the AI. And honestly, if your idea is so good that an AI roasting tool is your biggest IP threat, you probably have bigger problems to worry about." },
  { q: 'What if I get a terrible score?',          a: "Good. That's the point. A low score means you found the problems before you spent 18 months and your savings account on them. Most funded startups get roasted hard in early feedback — the ones that survive are the ones that listened. Getting a 2/10 from Kai is cheaper than getting a 0/10 from the market." },
  { q: "Can I roast an idea I'm already building?", a: 'Especially then. The earlier you get honest feedback, the cheaper it is to pivot. A roast at the idea stage costs you nothing. A roast at the Series A stage costs you everything. Use this before you use your runway.' },
  { q: 'What makes a better roast submission?',    a: 'Specificity. "An app for productivity" gets a generic roast. "A time-blocking tool for ADHD freelancers who miss deadlines because of context-switching, not laziness" gets a surgical one. Name the customer. Name the problem. Name why existing solutions fail them. The more precise your pitch, the more precise the damage.' },
  { q: 'How is this different from asking ChatGPT for feedback?', a: "ChatGPT is trained to be helpful and agreeable. It will find something encouraging to say about almost anything. Kai is specifically designed to apply startup validation frameworks — market size, competition moats, customer willingness to pay, timing — without softening the conclusion. You're not here for validation. You're here for the truth." },
  { q: 'Does a good score mean I should build it?', a: "A high score means the idea holds up to AI scrutiny, which is a low bar. The real test is still customer interviews, a landing page, and pre-orders. Think of a good score as permission to keep digging — not a green light to quit your job on a Monday." },
];

const ROAST_LIMIT = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

function getTier(score) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}

function getBarColor(score) {
  for (const [max, color] of Object.entries(BAR_COLORS)) {
    if (score <= Number(max)) return color;
  }
  return 'bg-green-500';
}

function truncate(str, len) {
  return str?.length > len ? str.slice(0, len) + '…' : str;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function PublicToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group w-full text-left focus:outline-none"
    >
      <div className={`relative flex-shrink-0 w-11 h-6 border-2 border-black transition-colors ${checked ? 'bg-black' : 'bg-white'}`}>
        <motion.div
          className={`absolute top-[2px] w-4 h-4 border-2 border-black ${checked ? 'bg-yellow-400' : 'bg-gray-300'}`}
          animate={{ left: checked ? '1.15rem' : '0.1rem' }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      </div>
      <div>
        <span className="comic-title text-sm text-black group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
          {checked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {checked ? 'IDEA IS PUBLIC' : 'KEEP THIS PRIVATE'}
        </span>
        <span className="comic-body text-xs text-gray-500 mt-0.5 block">
          {checked
            ? "May appear on the public Roast Board so others learn from your sacrifice."
            : "Only you see this roast. Your embarrassment stays between you and Kai."}
        </span>
      </div>
    </button>
  );
}

function SeverityBar({ score }) {
  const tier = getTier(score);
  const pct = (score / 10) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="comic-title text-xs text-gray-500">SEVERITY RATING</span>
        <span className={`comic-title text-xs ${tier.accent}`}>{tier.emoji} {tier.label}</span>
      </div>
      <div className="w-full h-4 bg-gray-100 border-2 border-black relative overflow-hidden">
        {[2, 4, 6, 8].map(n => (
          <div key={n} className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: `${n * 10}%` }} />
        ))}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          className={`h-full ${getBarColor(score)} relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="comic-title text-[10px] text-rose-700">☠ CONDEMNED</span>
        <span className="comic-title text-[10px] text-green-700">SHIP IT 🚀</span>
      </div>
    </div>
  );
}

function RoastRow({ label, accent = 'text-rose-700', children }) {
  const headerColor = ACCENT_HEADER_MAP[accent] || 'text-gray-400';
  return (
    <div className="border-b-2 border-black last:border-b-0">
      <div className="px-5 py-1 bg-black">
        <span className={`comic-title text-xs ${headerColor}`}>{label}</span>
      </div>
      <div className="px-5 py-4 bg-white">{children}</div>
    </div>
  );
}

/**
 * Shared report card body used by both RoastResults (inline) and RoastDetailModal (modal).
 * `compact` reduces score box size for the modal context.
 */
function RoastReport({ roast, idea, score, compact = false }) {
  const tier = getTier(score);
  const scoreBoxSize   = compact ? 'w-16 h-16' : 'w-20 h-20';
  const scoreTextSize  = compact ? 'text-3xl'  : 'text-4xl';

  return (
    <div className="border-3 border-black border-t-0 shadow-[6px_6px_0px_rgba(0,0,0,0.8)]">

      {/* Subject */}
      <div className="bg-yellow-50 border-b-2 border-black px-5 py-4">
        <p className="comic-title text-xs text-gray-400 mb-1.5">SUBJECT MATTER</p>
        <p className="comic-body text-sm text-gray-800 italic leading-relaxed">&ldquo;{idea}&rdquo;</p>
      </div>

      {/* Score + verdict */}
      <div className="bg-white border-b-2 border-black px-5 py-5">
        <div className="flex items-start gap-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
            className={`flex-shrink-0 ${scoreBoxSize} border-3 border-black flex flex-col items-center justify-center comic-shadow ${tier.bg}`}
          >
            <span className={`comic-title ${scoreTextSize} leading-none ${tier.accent}`}>{score}</span>
            <span className="comic-body text-[10px] text-gray-500">/ 10</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 comic-title text-xs px-3 py-1 border-2 border-black mb-2.5 ${tier.bg} ${tier.accent}`}>
              {tier.emoji} {tier.label}
            </div>
            <p className="comic-body text-sm text-gray-800 italic leading-relaxed">&ldquo;{roast.verdict}&rdquo;</p>
          </div>
        </div>
        <div className="mt-5">
          <SeverityBar score={score} />
        </div>
      </div>

      {/* Damage report */}
      <RoastRow label="DAMAGE REPORT" accent="text-rose-700">
        <ul className="space-y-3">
          {(roast.what_went_wrong || []).map((problem, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-5 h-5 bg-rose-700 text-white comic-title text-[10px] flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="comic-body text-sm text-gray-700 leading-relaxed">{problem}</p>
            </motion.li>
          ))}
        </ul>
      </RoastRow>

      {/* Competition + Archetype */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-black divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black">
        <div>
          <div className="px-5 py-1 bg-black">
            <span className="comic-title text-xs text-blue-300 flex items-center gap-1.5"><Target className="w-3 h-3" /> COMPETITION INTEL</span>
          </div>
          <div className="px-5 py-4 bg-white">
            <p className="comic-body text-sm text-gray-700 leading-relaxed">{roast.who_already_did_it}</p>
          </div>
        </div>
        <div>
          <div className="px-5 py-1 bg-black">
            <span className="comic-title text-xs text-yellow-400 flex items-center gap-1.5"><Zap className="w-3 h-3" /> FOUNDER ARCHETYPE</span>
          </div>
          <div className="px-5 py-4 bg-white">
            <p className="comic-body text-sm text-gray-700 italic leading-relaxed">&ldquo;{roast.founder_archetype}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Survivability */}
      <RoastRow label="12-MONTH SURVIVAL ODDS" accent="text-gray-400">
        <p className="comic-body text-sm text-gray-700 leading-relaxed">{roast.survivability}</p>
      </RoastRow>

      {/* One real advice */}
      <div className="border-b-2 border-black">
        <div className="px-5 py-1 bg-black flex items-center justify-between">
          <span className="comic-title text-xs text-green-400 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3" /> THE ONE USEFUL THING KAI WILL SAY
          </span>
          <span className="comic-title text-[9px] text-green-600 border border-green-800 px-1.5 py-0.5 rotate-1">ONLY MERCY</span>
        </div>
        <div className="px-5 py-4 bg-green-50">
          <p className="comic-body text-sm text-gray-800 leading-relaxed">{roast.one_real_advice}</p>
        </div>
      </div>

      {/* Closing burn */}
      <div>
        <div className="px-5 py-1 bg-rose-700">
          <span className="comic-title text-xs text-white flex items-center gap-1.5"><Flame className="w-3 h-3" /> CLOSING STATEMENT</span>
        </div>
        <div className="px-5 py-5 bg-rose-50">
          <p className="comic-body text-base text-rose-900 italic font-bold leading-relaxed">&ldquo;{roast.closing_burn}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

function RoastResults({ roast, idea, onReset }) {
  const score = Math.max(1, Math.min(10, Math.round(roast.roast_score)));
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-black border-3 border-black px-5 py-3 flex items-center justify-between">
        <span className="comic-title text-yellow-400 text-sm tracking-wider">KAI&apos;S ROAST REPORT</span>
        <span className="comic-body text-gray-500 text-xs">{date}</span>
      </div>

      <RoastReport roast={roast} idea={idea} score={score} />

      <div className="bg-yellow-50 border-2 border-t-0 border-black px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <span className="comic-body text-xs text-gray-400">generated by kai · zerosbykai.com</span>
        <motion.button
          onClick={onReset}
          whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' }}
          whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black border-2 border-black comic-title text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-50 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          ROAST ANOTHER
        </motion.button>
      </div>
    </motion.div>
  );
}

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-2 border-black bg-white comic-shadow hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-shadow"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 bg-yellow-50 hover:bg-yellow-100 transition-colors"
      >
        <span className="comic-title text-sm sm:text-base text-black pr-2 leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
          : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t-2 border-black bg-white">
              <p className="comic-body text-sm text-gray-700 leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RoastDetailModal({ entry, onClose }) {
  const { stop, start } = useSmoothScroll();
  const roast = entry.roast || {};
  const score = entry.roast_score;
  const date = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    stop(); // Lock smooth scroll
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
      start(); // Enable smooth scroll
    };
  }, [onClose, stop, start]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 z-[200] overflow-y-auto overscroll-contain"
      data-lenis-prevent
    >
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          {/* Header bar */}
          <div className="bg-black px-5 py-3 flex items-center justify-between border-3 border-black border-b-0">
            <span className="comic-title text-yellow-400 text-sm">KAI&apos;S ROAST REPORT</span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 transition-colors border border-gray-700"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="border-3 border-black border-t-0 shadow-[6px_6px_0px_rgba(0,0,0,0.8)]">
            {/* Meta row */}
            <div className="grid grid-cols-3 border-b-2 border-black">
              {[{ label: 'DATE', value: date }, { label: 'ANALYST', value: 'KAI' }, { label: 'STATUS', value: 'FILED' }].map(({ label, value }) => (
                <div key={label} className="px-4 py-2.5 border-r-2 border-black last:border-r-0 bg-yellow-50">
                  <p className="comic-body text-[10px] text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className="comic-title text-xs text-black">{value}</p>
                </div>
              ))}
            </div>

            {/* Shared report body */}
            <RoastReport roast={roast} idea={entry.idea} score={score} compact />

            {/* Footer */}
            <div className="bg-yellow-50 border-t-2 border-black px-5 py-3">
              <span className="comic-body text-xs text-gray-400">generated by kai · zerosbykai.com</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PitCard({ entry, index, onViewDetail }) {
  const score = entry.roast_score;
  const tier = getTier(score);
  const date = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.07 }}
      className="comic-panel bg-white comic-shadow flex flex-col"
    >
      {/* Score header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b-2 border-black ${tier.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`comic-title text-2xl leading-none ${tier.accent}`}>{score}</span>
          <span className="comic-body text-gray-400 text-xs">/ 10</span>
        </div>
        <span className={`comic-title text-xs px-2 py-0.5 border border-black ${tier.bg} ${tier.accent}`}>
          {tier.emoji} {tier.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="comic-body text-sm text-gray-800 italic leading-relaxed">
          &ldquo;{entry.roast?.summary || truncate(entry.idea, 120)}&rdquo;
        </p>

        {entry.roast?.verdict && (
          <div className="border-l-4 border-rose-700 pl-3">
            <p className="comic-body text-xs text-gray-500 leading-relaxed">{truncate(entry.roast.verdict, 90)}</p>
          </div>
        )}

        {entry.roast?.founder_archetype && (
          <p className="comic-title text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-300 px-2 py-0.5 self-start leading-relaxed truncate max-w-full">
            {truncate(entry.roast.founder_archetype, 50)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-black bg-gray-50 flex items-center justify-between gap-2">
        <span className="comic-body text-xs text-gray-400">{date}</span>
        <motion.button
          onClick={() => onViewDetail(entry)}
          whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' }}
          whileTap={{ x: 2, y: 2, boxShadow: '0px 0px 0px 0px #000' }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-yellow-400 border-2 border-black comic-title text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-gray-900 flex-shrink-0"
        >
          VIEW FULL ROAST →
        </motion.button>
      </div>
    </motion.div>
  );
}

function RoastPit() {
  const [roasts, setRoasts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    apiFetch('/api/roast/public?page=1')
      .then(data => {
        setRoasts(data.roasts || []);
        setHasMore(data.hasMore || false);
      })
      .catch(() => setError('Failed to load The Roast Pit.'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await apiFetch(`/api/roast/public?page=${nextPage}`);
      setRoasts(prev => [...prev, ...(data.roasts || [])]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
    } catch {
      setError('Failed to load more.');
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="comic-panel bg-white comic-shadow h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="comic-panel bg-rose-50 p-6 comic-shadow text-center">
        <p className="comic-body text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (roasts.length === 0) {
    return (
      <div className="comic-panel bg-white p-10 comic-shadow text-center">
        <p className="comic-title text-2xl text-gray-300 mb-2">NOTHING HERE YET</p>
        <p className="comic-body text-sm text-gray-400">
          Be the first to submit a public roast. Someone has to take the hit.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {roasts.map((entry, i) => (
          <PitCard key={entry.id} entry={entry} index={i} onViewDetail={setSelectedEntry} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <motion.button
            onClick={loadMore}
            disabled={loadingMore}
            whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' }}
            whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border-2 border-black comic-title text-sm shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'LOADING...' : 'LOAD MORE FROM THE PIT'}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {selectedEntry && (
          <RoastDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function RoastPage() {
  const { user, session, isLoading, openAuthModal, showAuthModal, roastCount, refreshRoastCount } = useAuth();

  const [idea, setIdea] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [caseNumber, setCaseNumber] = useState('');

  const formRef = useRef(null);
  const msgIntervalRef = useRef(null);

  useEffect(() => {
    setCaseNumber(String(Math.floor(Math.random() * 9000) + 1000));
  }, []);

  useEffect(() => {
    if (submitting) {
      msgIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 2400);
    } else {
      clearInterval(msgIntervalRef.current);
    }
    return () => clearInterval(msgIntervalRef.current);
  }, [submitting]);

  // Reset pendingSubmit if the auth modal is dismissed without signing in
  useEffect(() => {
    if (!showAuthModal && !user && pendingSubmit) setPendingSubmit(false);
  }, [showAuthModal, user, pendingSubmit]);

  const submitRoast = useCallback(async () => {
    setSubmitting(true);
    setError('');
    setResult(null);
    setLoadingMsgIdx(0);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    try {
      const data = await apiFetch('/api/roast', {
        method: 'POST',
        body: JSON.stringify({ idea, is_public: isPublic }),
        signal: controller.signal,
      }, session);
      setResult(data);
      refreshRoastCount();
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'Kai took too long. Try again with a shorter idea.'
          : err.message || 'Something went wrong. Try again.'
      );
      if (err.message?.includes('limit')) {
        refreshRoastCount();
      }
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }, [idea, isPublic, session, refreshRoastCount]);

  // Auto-submit after sign-in
  useEffect(() => {
    if (user && pendingSubmit && !submitting && !result) {
      setPendingSubmit(false);
      submitRoast();
    }
  }, [user, pendingSubmit, submitting, result, submitRoast]);

  const handleRoastClick = (e) => {
    e?.preventDefault();
    if (idea.trim().length < 10 || submitting) return;
    if (user && roastCount >= ROAST_LIMIT) return;
    if (!user) {
      setPendingSubmit(true);
      openAuthModal('signin');
      return;
    }
    submitRoast();
  };

  const handleReset = useCallback(() => {
    setResult(null);
    setIdea('');
    setIsPublic(false);
    setError('');
  }, []);

  return (
    <div className="min-h-screen bg-yellow-50">
      <Head>
        <title>Roast My Startup Idea | Zeros By Kai</title>
        <meta name="description" content="Submit your startup idea and get a brutally honest AI roast from Kai. No sugarcoating. Real problems. Real feedback." />
        <meta property="og:title" content="Roast My Startup Idea — Zeros By Kai" />
        <meta property="og:description" content="Your incubator friends will tell you it's brilliant. Kai won't." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zerosbykai.com/roast" />
        <meta property="og:image" content="https://zerosbykai.com/og-hero.png" key="ogimage" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@zerosbykai" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ_DATA.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            })
          }}
        />
      </Head>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-black pt-28 pb-20 sm:pt-36 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 1px, transparent 1px, transparent 18px)' }} />
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-700" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-rose-700" />

        <motion.div
          className="relative max-w-3xl mx-auto text-center z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-rose-700 text-white px-4 py-1.5 comic-title text-xs sm:text-sm mb-6 -rotate-1 border-2 border-yellow-400">
            <Flame className="w-3.5 h-3.5" />
            BRUTAL AI FEEDBACK · NO PARTICIPATION TROPHIES
          </div>

          <h1 className="comic-title text-5xl sm:text-7xl lg:text-8xl text-white leading-none">
            YOUR IDEA
          </h1>
          <h1 className="comic-title text-5xl sm:text-7xl lg:text-8xl text-yellow-400 leading-none mb-4">
            PROBABLY SUCKS.
          </h1>
          <p className="comic-title text-xl sm:text-2xl text-gray-600 mb-8">let kai confirm it.</p>

          <p className="comic-body text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Your co-founder thinks it&apos;s genius. Your mom agrees.{' '}
            <span className="text-yellow-400 font-bold">Kai does not.</span>{' '}
            Find out what&apos;s actually wrong before you waste a year of your life building it.
          </p>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap mb-10">
            {[
              { val: '100%', label: 'UNFILTERED' },
              { val: '0%',   label: 'SUGARCOATED' },
              { val: '1',    label: 'MERCY PER ROAST' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="comic-title text-yellow-400 text-3xl sm:text-4xl">{val}</div>
                <div className="comic-body text-gray-600 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              whileHover={{ x: 1, y: 1, boxShadow: '2px 2px 0px 0px #92400e' }}
              whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' }}
              className="flex items-center gap-2 px-8 py-4 bg-yellow-400 text-black border-2 border-yellow-500 comic-title text-base shadow-[3px_3px_0px_0px_#92400e] hover:bg-yellow-300 transition-colors w-full sm:w-auto justify-center"
            >
              <Flame className="w-5 h-5" />
              START YOUR ROAST
            </motion.button>
            <a
              href="#how-it-works"
              className="comic-title text-sm text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
            >
              SEE HOW IT WORKS <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ══ FORM / RESULTS ═══════════════════════════════════════════════════ */}
      <section ref={formRef} className="px-4 sm:px-6 py-14 sm:py-20 text-black">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RoastResults roast={result.roast} idea={result.idea} onReset={handleReset} />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <p className="comic-body text-xs text-gray-400 uppercase tracking-widest mb-2">step one</p>
                  <h2 className="comic-title text-3xl sm:text-4xl text-black mb-2">SUBMIT YOUR IDEA</h2>
                  <p className="comic-body text-sm text-gray-500">No pressure. It&apos;s only your dignity on the line.</p>
                </div>

                <div className="comic-panel bg-white comic-shadow">
                  <div className="bg-black px-5 py-3 flex items-center justify-between">
                    <span className="comic-title text-yellow-400 text-xs tracking-widest">KAI&apos;S ROAST BUREAU</span>
                    <span className="comic-body text-gray-600 text-xs">CASE #{caseNumber}</span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    <form onSubmit={handleRoastClick} className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="comic-title text-xs text-gray-500 uppercase tracking-widest">
                            Your Startup Idea
                          </label>
                          <span className={`comic-body text-xs transition-colors ${idea.length > 1800 ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                            {idea.length}/2000
                          </span>
                        </div>
                        <textarea
                          value={idea}
                          onChange={e => { setIdea(e.target.value); if (error) setError(''); }}
                          placeholder={"What problem does it solve? Who's the customer? Why is now the right time?\n\nThe more specific you are, the more surgical the burn."}
                          rows={7}
                          maxLength={2000}
                          disabled={submitting}
                          className="w-full border-2 border-black p-3 comic-body text-sm leading-relaxed resize-none overflow-y-auto max-h-48 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-300"
                        />
                        {idea.length > 0 && idea.trim().length < 10 && (
                          <p className="comic-body text-xs text-rose-600 mt-1">Too short — give Kai more to work with.</p>
                        )}
                      </div>
                      <div className="border-t-2 border-dashed border-gray-200" />
                      <PublicToggle checked={isPublic} onChange={setIsPublic} />
                      <div className="border-t-2 border-dashed border-gray-200" />

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border-2 border-rose-600 bg-rose-50 p-4 comic-shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-rose-600 p-1.5 animate-pulse">
                              <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="comic-title text-[10px] text-rose-600 uppercase tracking-widest mb-1">CRITICAL FAILURE / KAI ERROR</p>
                              <p className="comic-body text-sm text-rose-900 leading-relaxed mb-3">{error}</p>
                              <button
                                type="button"
                                onClick={e => { e.preventDefault(); submitRoast(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white comic-title text-xs hover:bg-rose-700 transition-colors uppercase"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Try Again
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {pendingSubmit && !user && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-2 border-yellow-500 bg-yellow-50 px-4 py-3">
                              <p className="comic-title text-xs text-yellow-700">
                                ⏳ SIGN IN TO PROCEED — YOUR ROAST IS QUEUED.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={submitting || idea.trim().length < 10 || (!!user && roastCount >= ROAST_LIMIT)}
                        whileHover={!submitting && idea.trim().length >= 10 && (!user || roastCount < ROAST_LIMIT) ? { x: 1, y: 1, boxShadow: '2px 2px 0px 0px #000' } : {}}
                        whileTap={!submitting && idea.trim().length >= 10 && (!user || roastCount < ROAST_LIMIT) ? { x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000' } : {}}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-yellow-400 border-2 border-black comic-title text-base sm:text-lg shadow-[3px_3px_0px_0px_#000] hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        <Flame className={`w-5 h-5 ${submitting ? 'animate-pulse' : ''}`} />
                        {submitting ? 'ROASTING...' : roastCount >= ROAST_LIMIT && !!user ? 'LIMIT REACHED' : 'ROAST ME NOW'}
                      </motion.button>

                      {user && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full h-1.5 bg-gray-100 border border-black overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (roastCount / ROAST_LIMIT) * 100)}%` }}
                              className={`h-full ${roastCount >= ROAST_LIMIT ? 'bg-rose-600' : 'bg-yellow-400'}`}
                            />
                          </div>
                          <p className="comic-body text-[10px] text-gray-500 uppercase tracking-widest">
                            {roastCount} / {ROAST_LIMIT} ROASTS USED
                            {roastCount >= ROAST_LIMIT && <span className="text-rose-600 font-bold ml-1.5">· LIMIT REACHED</span>}
                          </p>
                        </div>
                      )}

                      {!isLoading && !user && !pendingSubmit && (
                        <p className="comic-body text-xs text-center text-gray-400">
                          <ArrowRight className="w-3 h-3 inline mr-1 -mt-0.5" />
                          You&apos;ll be asked to sign in first — roast fires right after.
                        </p>
                      )}
                    </form>
                  </div>
                </div>

                {/* Loading message */}
                <AnimatePresence mode="wait">
                  {submitting && (
                    <motion.div
                      key={loadingMsgIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 text-center"
                    >
                      <div className="inline-flex items-center gap-2 comic-panel bg-yellow-50 px-5 py-3 comic-shadow">
                        <Flame className="w-4 h-4 text-rose-700 animate-pulse flex-shrink-0" />
                        <p className="comic-body text-sm text-gray-700 italic">
                          {LOADING_MESSAGES[loadingMsgIdx]}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!submitting && (
                  <p className="comic-body text-xs text-gray-400 text-center mt-6">
                    Results are AI-generated. Kai has no personal vendetta against your idea. Probably.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-20 bg-white border-b-4 border-black text-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="comic-body text-xs text-gray-400 uppercase tracking-widest mb-2">the process</p>
            <h2 className="comic-title text-3xl sm:text-5xl text-black">HOW IT WORKS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="comic-panel bg-white p-6 comic-shadow flex gap-4"
              >
                <span className="comic-title text-5xl text-gray-100 leading-none flex-shrink-0 select-none">
                  {step.num}
                </span>
                <div>
                  <div className="text-xl mb-2">{step.icon}</div>
                  <h3 className="comic-title text-base sm:text-lg text-black mb-1.5">{step.title}</h3>
                  <p className="comic-body text-sm text-gray-600 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ THE ROAST PIT ════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-yellow-50 border-t-4 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="comic-body text-xs text-gray-400 uppercase tracking-widest mb-2">publicly roasted</p>
            <h2 className="comic-title text-3xl sm:text-5xl text-black mb-3 flex items-center justify-center gap-3">
              <Skull className="w-8 h-8 sm:w-10 sm:h-10" />
              THE ROAST PIT
            </h2>
            <p className="comic-body text-sm text-gray-500 max-w-md mx-auto">
              Ideas that dared to be judged. Publicly. Learn from their sacrifice.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 bg-black text-yellow-400 comic-title text-xs px-3 py-1.5 border-2 border-black">
              <Users className="w-3 h-3" />
              TOGGLE &ldquo;IDEA IS PUBLIC&rdquo; TO JOIN THEM
            </div>
          </div>

          <RoastPit />
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-white border-t-4 border-black">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="comic-body text-xs text-gray-400 uppercase tracking-widest mb-2">got questions?</p>
            <h2 className="comic-title text-3xl sm:text-5xl text-black mb-3">FREQUENTLY ASKED</h2>
            <p className="comic-body text-sm text-gray-500 max-w-md mx-auto">
              Things people ask before they let an AI destroy their startup dreams.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQ_DATA.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </div>

          <div className="mt-10 text-center comic-panel bg-yellow-50 p-6 comic-shadow">
            <p className="comic-title text-sm text-black mb-1">STILL HAVE QUESTIONS?</p>
            <p className="comic-body text-sm text-gray-600">
              That&apos;s probably a sign your idea needs more work.{' '}
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="text-rose-700 underline underline-offset-2 hover:text-black transition-colors comic-title text-sm"
              >
                Submit it and find out.
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

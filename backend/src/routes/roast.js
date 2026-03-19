import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';

const router = express.Router();

// Module-level singleton — avoids re-instantiation on every request
let _genAI = null;
function getGenAI() {
    if (!_genAI && config.gemini.apiKey) {
        _genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    }
    return _genAI;
}

const roastLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.nodeEnv === 'production' ? 5 : 50,
    message: { error: "Kai is hyperventilating. Too many roasts, not enough caffeine. Give him 15 minutes to recalibrate." }
});

const GEMINI_TIMEOUT_MS = 45000;

router.post('/', roastLimiter, requireAuth, async (req, res) => {
    const { idea, is_public } = req.body;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
        return res.status(400).json({ error: 'Give Kai something to work with. At least 10 characters.' });
    }

    if (idea.length > 2000) {
        return res.status(400).json({ error: 'Trim the pitch deck. Keep it under 2000 characters.' });
    }

    const genAI = getGenAI();
    if (!genAI) {
        return res.status(503).json({ error: "Kai's logic circuits are literally on fire. The AI judge is offline." });
    }

    const modelChain = [
        config.gemini.models.primary,
        config.gemini.models.fallback,
        config.gemini.models.fallbackLite,
    ].filter(Boolean);

    const prompt = buildRoastPrompt(idea.trim());
    let lastError;

    for (const modelName of modelChain) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            // Race Gemini call against a hard timeout
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), GEMINI_TIMEOUT_MS)
                ),
            ]);

            const text = result.response.text();
            const roast = parseRoastResponse(text);
            console.log(`[Roast] Success with model: ${modelName}`);

            // Persist roast (non-fatal — don't block the response if DB write fails)
            supabaseAdmin.from('roasts').insert({
                user_id: req.user.id,
                idea: idea.trim(),
                roast,
                roast_score: roast.roast_score,
                is_public: !!is_public,
            }).then(({ error: dbErr }) => {
                if (dbErr) console.warn('[Roast] DB save failed:', dbErr.message);
            });

            return res.json({ success: true, roast, idea: idea.trim(), is_public: !!is_public });

        } catch (err) {
            console.warn(`[Roast] Model ${modelName} failed: ${err.message}`);
            lastError = err;

            // Hard timeout — no point trying other models
            if (err.message === 'TIMEOUT') break;

            // Rate limited — wait before trying next model
            if (err.message?.includes('429')) {
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }

    const isTimeout = lastError?.message === 'TIMEOUT';
    const status = isTimeout ? 504 : 500;
    const message = isTimeout
        ? 'Kai fell asleep mid-sentence. Your idea is either too complex or too boring. Shake the desk (retry).'
        : 'The AI judge just had a minor existential crisis processing that. Give him another shot.';

    console.error('[Roast] All models failed:', lastError?.message);
    res.status(status).json({ error: message });
});

// Public feed — no auth required
const PUBLIC_PAGE_SIZE = 12;

router.get('/public', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PUBLIC_PAGE_SIZE;

    try {
        const { data, error, count } = await supabaseAdmin
            .from('roasts')
            .select('id, idea, roast_score, created_at, roast', { count: 'exact' })
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + PUBLIC_PAGE_SIZE - 1);

        if (error) throw error;

        res.json({
            roasts: data,
            total: count,
            page,
            hasMore: offset + PUBLIC_PAGE_SIZE < count,
        });
    } catch (err) {
        console.error('[Roast] Public feed error:', err.message);
        res.status(500).json({ error: 'Failed to load the Hall of Shame.' });
    }
});

function buildRoastPrompt(idea) {
    // JSON.stringify the user input to prevent prompt injection
    const safeIdea = JSON.stringify(idea);

    return `You are Kai — a brutally honest AI startup analyst with zero tolerance for mediocrity, buzzwords, or "I'll figure out monetization later" energy. Your job is to ROAST the following startup idea. Be savage, specific, and edgy — but also genuinely insightful. You are NOT here to hand out participation trophies.

STARTUP IDEA (user input):
${safeIdea}

Return ONLY a valid JSON object. No markdown fences, no backticks, no explanation. Just raw JSON matching this exact structure:

{
  "summary": "A one-line professional summary of the startup idea (max 100 characters)",
  "verdict": "One brutally honest sentence verdict on this idea (max 120 characters)",
  "roast_score": <integer 1-10>,
  "score_label": "A snarky all-caps label matching the score tier (see below)",
  "what_went_wrong": [
    "Specific brutal problem #1 — be precise, not generic",
    "Specific brutal problem #2",
    "Specific brutal problem #3"
  ],
  "who_already_did_it": "Name 2-3 existing startups or products already doing this. If no one has, say: Surprisingly, the market is wide open — which either means you found a goldmine or everyone else knew better.",
  "founder_archetype": "A snarky but accurate description of the type of founder who pitches this idea",
  "survivability": "One blunt sentence on their actual probability of surviving 12 months with this idea",
  "one_real_advice": "ONE piece of genuinely useful, actionable advice. This is the one moment of mercy.",
  "closing_burn": "One final line — savage, slightly encouraging, and memorable."
}

SCORING RUBRIC (BE FAIR BUT RUTHLESS):
- 1-2: CERTIFIED DUMPSTER FIRE (Cringe, incoherent, or dangerously saturated)
- 3-4: ENTHUSIASTIC AMATEUR (A cliche "Uber for X" with zero market insight)
- 5-6: LUKEWARM GARBAGE (Has one decent idea buried in a sea of bad execution)
- 7-8: ALMOST NOT TERRIBLE (Actually interesting. Solid problem/market fit but high risk)
- 9-10: DEFENSIBLE (Genuinely good. Rare. Roast their hubris instead of the idea itself)`;
}

const REQUIRED_STRING_FIELDS = [
    'summary', 'verdict', 'score_label', 'who_already_did_it',
    'founder_archetype', 'survivability', 'one_real_advice', 'closing_burn',
];

function parseRoastResponse(text) {
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

    try {
        const data = JSON.parse(cleaned);

        // Validate and coerce required fields
        for (const field of REQUIRED_STRING_FIELDS) {
            if (typeof data[field] !== 'string' || !data[field].trim()) {
                throw new Error(`Missing or empty field: ${field}`);
            }
        }

        if (!Array.isArray(data.what_went_wrong) || data.what_went_wrong.length === 0) {
            throw new Error('Missing what_went_wrong array');
        }

        // Coerce and clamp score — Gemini sometimes returns a string
        const score = Math.max(1, Math.min(10, Math.round(Number(data.roast_score))));
        if (isNaN(score)) throw new Error('Invalid roast_score');
        data.roast_score = score;

        return data;

    } catch (err) {
        console.warn('[Roast] Parse/validation failed:', err.message);
        throw err; // Propagate error so model loop can try next or fail properly
    }
}

export default router;

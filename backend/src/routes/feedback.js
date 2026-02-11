import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { config } from '../config/env.js';

const router = express.Router();

// Specific rate limiter for feedback to prevent spam
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.nodeEnv === 'production' ? 5 : 50, // 5 requests per 15 min in prod
    message: { error: 'You are transmitting data too fast. Kai needs a moment to process.' }
});

// Feedback handler with Supabase integration
// Uses optionalAuth to securely identify users if they are logged in
router.post('/', feedbackLimiter, optionalAuth, async (req, res) => {
    // SECURITY: user_id from req.body is EXPLICITLY IGNORED to prevent impersonation
    const { type, message, email, path } = req.body;
    const user_id = req.user?.id || null;

    if (!message) {
        return res.status(400).json({ error: 'Feedback message is required' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('feedback')
            .insert([
                {
                    type,
                    message: message.substring(0, 5000),
                    email: email || null,
                    path: path || null,
                    user_id: user_id || null
                }
            ]);

        if (error) throw error;

        console.log(`✅ Feedback stored in DB (${type})`);
        res.json({ success: true, message: 'Kai has received your data and stored it in the archives.' });
    } catch (err) {
        console.error('❌ Feedback storage error:', err.message);

        // Fallback to console logging if DB insertion fails
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'FEEDBACK_FALLBACK_LOG',
            type,
            email,
            path,
            message: message.substring(0, 1000)
        }, null, 2));

        res.status(500).json({
            error: 'Kai&apos;s data uplink is unstable, but we logged it in the console.',
            message: err.message
        });
    }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * POST /api/webhooks/brevo
 * 
 * Handles incoming webhooks from Brevo to sync deletions and unsubscriptions.
 * Expected query param: ?token=YOUR_BREVO_WEBHOOK_SECRET
 */
router.post('/brevo', async (req, res) => {
    try {
        const { token } = req.query;

        // Security check — compare HMAC digests so length is always equal (timing-safe)
        const secret = config.brevo.webhookSecret;
        let isValid = false;
        if (token && secret) {
            const expected = crypto.createHmac('sha256', secret).update(secret).digest();
            const actual = crypto.createHmac('sha256', secret).update(token).digest();
            isValid = crypto.timingSafeEqual(expected, actual);
        }

        if (!isValid) {
            console.warn(`⚠️  Unauthorized Brevo webhook attempt (invalid token): ${token ? '***' + token.slice(-4) : 'none'}`);
            return res.status(401).json({ error: 'Unauthorized: Invalid webhook token' });
        }

        const payload = req.body;
        const { event, email } = payload;

        if (!email) {
            console.warn('⚠️  Received Brevo webhook without email payload');
            return res.status(400).json({ error: 'Missing email' });
        }

        console.log(`📡 Brevo Webhook Received: ["${event}"] for ${email}`);

        // Debug logging (development only, no PII)
        if (!event && process.env.NODE_ENV === 'development') {
            console.log('📦 Debug: Received Brevo webhook with missing event');
            // Full payload logging is DISABLED in production to protect PII
        }

        // Handle Contact Deletion
        if (event === 'contact_deleted' || event === 'contactDeleted') {
            const { data: subscriber } = await supabaseAdmin
                .from('subscribers')
                .select('user_id')
                .eq('email', email)
                .maybeSingle();

            if (subscriber?.user_id) {
                // 1. Delete from subscribers (and potentially other related tables via CASCADE if configured)
                await supabaseAdmin.from('subscribers').delete().eq('user_id', subscriber.user_id);
                // 2. Delete from Auth
                await supabaseAdmin.auth.admin.deleteUser(subscriber.user_id);
                console.log(`  🗑️  Successfully deleted user ${email} from Supabase (triggered by Brevo)`);
            } else {
                // If they are only in subscribers (newsletter only)
                await supabaseAdmin.from('subscribers').delete().eq('email', email);
                console.log(`  🗑️  Successfully deleted subscriber ${email} from Supabase (triggered by Brevo)`);
            }
        }

        // Handle Unsubscription / Blocklisting / Bounces / Spam
        else if (
            event === 'unsubscribe' ||
            event === 'unsubscribed' ||
            event === 'hard_bounce' ||
            event === 'hardBounce' ||
            event === 'soft_bounce' ||
            event === 'soft_bounced' ||
            event === 'softBounce' ||
            event === 'spam' ||
            event === 'complaint' ||
            event === 'blocked' ||
            event === 'blocklisted' ||
            event === 'invalid'
        ) {
            const { error } = await supabaseAdmin
                .from('subscribers')
                .update({ unsubscribed_at: new Date().toISOString(), unsubscribe_reason: event })
                .eq('email', email);

            if (error) throw error;
            console.log(`  🚫  Successfully marked ${email} as unsubscribed in Supabase (event: ${event})`);
        }

        res.json({ message: 'Webhook processed' });
    } catch (error) {
        console.error('❌ Brevo Webhook processing failed:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

import express from 'express';
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

        // Security check
        if (config.brevo.webhookSecret && token !== config.brevo.webhookSecret) {
            console.warn(`⚠️  Unauthorized Brevo webhook attempt (invalid token): ${token}`);
            return res.status(401).json({ error: 'Unauthorized: Invalid webhook token' });
        }

        const payload = req.body;
        const { event, email } = payload;

        if (!email) {
            console.warn('⚠️  Received Brevo webhook without email payload');
            return res.status(400).json({ error: 'Missing email' });
        }

        console.log(`📡 Brevo Webhook Received: ["${event}"] for ${email}`);

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

        // Handle Unsubscription / Blocklisting
        else if (event === 'unsubscribe' || event === 'unsubscribed') {
            const { error } = await supabaseAdmin
                .from('subscribers')
                .update({ unsubscribed_at: new Date().toISOString() })
                .eq('email', email);

            if (error) throw error;
            console.log(`  🚫  Successfully unsubscribed user ${email} in Supabase (triggered by Brevo)`);
        }

        res.json({ message: 'Webhook processed' });
    } catch (error) {
        console.error('❌ Brevo Webhook processing failed:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

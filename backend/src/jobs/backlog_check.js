import { supabaseAdmin } from '../config/supabase.js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env if not already loaded
if (!process.env.RESEND_API_KEY) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

if (!process.env.RESEND_API_KEY) {
    console.error('❌ FATAL: RESEND_API_KEY is missing. Cannot initialize backlog check.');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = 'kai@zerosbykai.com';

/**
 * Checks the current backlog count and sends an alert if it's too low.
 */
export async function checkBacklogHealth() {
    console.log('🔍 Checking backlog health...');

    try {
        // Query backlog items
        const { count, error } = await supabaseAdmin
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'backlog');

        if (error) throw error;

        console.log(`📊 Current backlog: ${count} ideas.`);

        if (count < 10) {
            console.log('⚠️  Backlog is low! Sending alert email...');

            const { data, error: emailError } = await resend.emails.send({
                from: 'Kai <kai@zerosbykai.com>',
                to: adminEmail,
                subject: '🚨 Action Required: Backlog is Low!',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h1 style="color: #e63946;">Low Backlog Alert</h1>
                        <p>We only have <b>${count}</b> ideas in the backlog.</p>
                        <p>To ensure a full newsletter for Monday, please run the scraper locally to generate more unique "Zero" startup ideas.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <code>npm run scrape:local</code> (or equivalent command)
                        </div>
                        <p>This check runs every Friday and Sunday to keep our pipeline healthy.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">ZerosByKai Automation</p>
                    </div>
                `
            });

            if (emailError) {
                console.error('❌ Failed to send alert email:', emailError);
            } else {
                console.log(`✅ Alert email sent successfully. ID: ${data.id}`);
            }
        } else {
            console.log('✅ Backlog health is GOOD.');
        }

        return { count, alerted: count < 10 };
    } catch (error) {
        console.error('❌ Error checking backlog health:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    checkBacklogHealth()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

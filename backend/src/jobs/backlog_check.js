import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from '../utils/emailService.js';
import { ADMIN_CONFIG } from '../utils/helpers.js';

const adminEmail = ADMIN_CONFIG.email;

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

        const threshold = ADMIN_CONFIG.backlogThreshold || 10;
        console.log(`📊 Current backlog: ${count} ideas (Threshold: ${threshold}).`);

        if (count < threshold) {
            console.log('⚠️  Backlog is low! Sending alert email...');

            const { success, error: emailError, data } = await sendEmail({
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

            if (!success) {
                console.error('❌ Failed to send alert email:', emailError);
            } else {
                console.log(`✅ Alert email sent successfully. ID: ${data.MessageId}`);
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

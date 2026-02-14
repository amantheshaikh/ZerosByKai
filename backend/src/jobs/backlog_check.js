import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from '../utils/emailService.js';
import { config } from '../config/env.js';
import { getMonday } from '../utils/dateUtils.js';

const adminEmail = config.admin.email;

/**
 * Checks if the upcoming Monday's newsletter is scheduled.
 * If not, sends a reminder to the admin.
 */
export async function checkScheduleHealth() {
    console.log('🔍 Checking newsletter schedule status...');

    try {
        // 1. Calculate next Monday using UTC to match dateUtils.js
        // getMonday() returns current week's Monday (UTC).
        // For health check, we need the UPCOMING Monday (could be this week or next).
        const currentMonday = getMonday();
        const today = new Date();
        
        // If today is Monday (getMonday returns today), check for upcoming Monday
        // If today is any other day, getMonday returns this week's Monday
        // For the health check, we want to check the NEXT Monday to be published
        const currentMondayDate = new Date(currentMonday + 'T00:00:00Z');
        const today_midnight_utc = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        
        let nextMonday;
        if (today_midnight_utc <= currentMondayDate) {
            // Today is before or on Monday, so next Monday = current Monday (if in future)
            // or the Monday after (if current Monday is past)
            const diffMs = currentMondayDate.getTime() - today_midnight_utc.getTime();
            if (diffMs >= 0) {
                nextMonday = currentMonday;
            } else {
                // Current Monday is in the past, add 7 days
                const nextMondayDate = new Date(currentMondayDate);
                nextMondayDate.setUTCDate(nextMondayDate.getUTCDate() + 7);
                nextMonday = nextMondayDate.toISOString().split('T')[0];
            }
        } else {
            // Today is after Monday, add 7 days to current Monday
            const nextMondayDate = new Date(currentMondayDate);
            nextMondayDate.setUTCDate(nextMondayDate.getUTCDate() + 7);
            nextMonday = nextMondayDate.toISOString().split('T')[0];
        }
        console.log(`📅 Target Newsletter Date: ${nextMonday}`);

        // 2. Check if batch exists
        const { data: batch, error } = await supabaseAdmin
            .from('weekly_batches')
            .select('id, subject_line, total_ideas')
            .eq('week_start_date', nextMonday)
            .maybeSingle();

        if (error) throw error;

        if (batch && batch.subject_line && batch.total_ideas >= 10) {
            console.log(`✅ Newsletter for ${nextMonday} is valid and scheduled.`);
            console.log(`   Subject: "${batch.subject_line}"`);
            console.log(`   Ideas Locked: ${batch.total_ideas}`);
            return { scheduled: true };
        }

        // 3. Not Scheduled - Check Approved Queue for context
        console.log(`⚠️  Newsletter for ${nextMonday} is NOT scheduled.`);

        const { count: approvedCount } = await supabaseAdmin
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        console.log(`   Approved Ideas Available: ${approvedCount}`);

        // 4. Send Alert
        console.log('📧 Sending reminder email...');

        const { success, error: emailError } = await sendEmail({
            to: adminEmail,
            subject: '⚠️ Reminder: Schedule Next Week\'s Newsletter',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #F4A261;">Newsletter Not Scheduled</h1>
                    <p>The newsletter for <b>${nextMonday}</b> has not been prepared yet.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin:0 0 10px 0;"><b>Approved Queue:</b> ${approvedCount} ideas ready.</p>
                        ${approvedCount < 10 ? '<p style="color: #e63946; margin:0;">⚠️ Not enough approved ideas (Need 10). Please approve more in Supabase.</p>' : '<p style="color: #2a9d8f; margin:0;">✅ Enough ideas available.</p>'}
                    </div>

                    <h3>Action Required:</h3>
                    ${approvedCount < 10 ? '<li>Go to Supabase and change status to <code>approved</code> for 10+ ideas.</li>' : ''}
                    <li>Run <code>npm run schedule -- --weeks 1</code></li>

                    <p style="font-size: 12px; color: #666; margin-top: 30px;">This check runs on Wed, Fri, and Sun at 9 AM UTC.</p>
                </div>
            `
        });

        if (!success) {
            console.error('❌ Failed to send alert email:', emailError?.message || 'Unknown error');
            // Continue anyway - backlog check itself still ran, just notification failed
        } else {
            console.log('✅ Reminder sent to admin.');
        }

        return { scheduled: false };

    } catch (error) {
        console.error('❌ Error checking schedule health:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    // Check if we should only run on specific days (Wed=3, Fri=5, Sun=0)
    if (process.argv.includes('--scheduled')) {
        const day = new Date().getUTCDay();
        const allowedDays = [0, 3, 5]; // Sun, Wed, Fri
        if (!allowedDays.includes(day)) {
            console.log(`ℹ️  Not a scheduled check day (Day: ${day}). Skipping.`);
            process.exit(0);
        }
    }

    checkScheduleHealth()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

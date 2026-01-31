
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { supabaseAdmin } from '../config/supabase.js';
import { generateWeeklyDigestEmail } from '../emails/templates.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env if not already loaded
if (!process.env.RESEND_API_KEY) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Force production URL for simulation so links work when checking email on phone/etc
process.env.FRONTEND_URL = 'https://zerosbykai.com';

async function simulateNewsletter() {
    console.log('Starting newsletter simulation...');

    // 1. Fetch latest PUBLISHED ideas (limit 10)
    // We prioritize 'published' status to ensure they are "real" approved ideas.
    let { data: ideas, error } = await supabaseAdmin
        .from('ideas')
        .select('*')
        .eq('status', 'published')
        .order('week_published', { ascending: false }) // Get newest weeks first
        .order('created_at', { ascending: true })     // Then oldest within week (to match UI order 1..10)
        .limit(10);

    if (error) {
        console.error('Error fetching ideas:', error);
        return;
    }

    if (!ideas || ideas.length === 0) {
        // Fallback to pending if no published ideas exists (e.g. testing new flow)
        console.log('No published ideas found, trying pending...');
        const { data: pendingIdeas } = await supabaseAdmin
            .from('ideas')
            .select('*')
            .eq('status', 'pending')
            .limit(10);
        ideas = pendingIdeas || [];
    }

    if (ideas.length === 0) {
        console.warn('No ideas found in DB (published or pending). Cannot simulate.');
        return;
    }

    console.log(`Fetched ${ideas.length} ideas for simulation.`);

    // 2. Fetch Latest REAL Winner
    // Find the most recent batch that HAS a winner
    let winner = null;
    let badgeCount = 0;

    const { data: batches } = await supabaseAdmin
        .from('weekly_batches')
        .select('*, winner:winner_idea_id(*)')
        .not('winner_idea_id', 'is', null) // Only batches with winners
        .order('week_start_date', { ascending: false })
        .limit(1);

    if (batches && batches.length > 0) {
        winner = batches[0].winner;
        badgeCount = batches[0].total_votes || 42; // Fallback vote count if 0/null
        console.log(`Found real winner: ${winner.name} (from week ${batches[0].week_start_date})`);
    } else {
        console.warn('No past winners found in DB. Winner section will be hidden or mocked.');
    }

    // 3. Generate HTML
    const today = new Date();
    // Use the date of the ideas if available, else today
    const weekDate = ideas[0]?.week_published || today.toISOString().split('T')[0];
    const dateString = new Date(weekDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const html = generateWeeklyDigestEmail({
        ideas: ideas,
        winner: winner,
        badgeCount: badgeCount,
        threadCount: 2350,   // This is usually metadata, acceptable to mock or fetch if available
        weekDate: dateString
    });

    // 4. Send Email
    const targetEmail = 'amantheshaikh@gmail.com';
    console.log(`Sending simulated newsletter to ${targetEmail}...`);

    try {
        const token = Buffer.from(targetEmail).toString('base64');
        const personalHtml = html
            .replace('{{email}}', targetEmail)
            .replace('{{token}}', token);

        await resend.emails.send({
            from: 'Kai <kai@zerosbykai.com>',
            reply_to: 'kai@zerosbykai.com',
            to: targetEmail,
            subject: `[SIMULATION] Kai's Zeros: Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            html: personalHtml
        });
        console.log('Simulation email sent successfully!');
    } catch (e) {
        console.error('Failed to send simulation email:', e);
    }
}

simulateNewsletter();

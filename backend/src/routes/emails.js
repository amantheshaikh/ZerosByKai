import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { generateWeeklyDigestEmail } from '../emails/templates/weekly-digest.js';
import { generateWelcomeEmail } from '../emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../emails/templates/magic-link.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * GET /api/emails/view/:type/:id?
 * Renders an email template as HTML for "View in browser" links.
 */
router.get('/view/:type/:id?', async (req, res) => {
    const { type, id } = req.params;

    try {
        let html = '';

        if (type === 'weekly') {
            const weekStart = id || getMonday();

            // 1. Fetch ideas for the week
            const { data: ideas, error: ideasError } = await supabaseAdmin
                .from('ideas')
                .select('*')
                .eq('week_published', weekStart)
                .eq('status', 'published')
                .order('created_at', { ascending: true });

            if (ideasError) throw ideasError;

            // If no ideas found, just use empty array for preview instead of 404
            const validIdeas = ideas || [];

            // 2. Fetch last week's winner
            const lastWeekStart = getLastMonday(new Date(weekStart));
            const { data: lastWeekBatch } = await supabaseAdmin
                .from('weekly_batches')
                .select(`
                  *,
                  winner:ideas!fk_weekly_batches_winner_idea (*)
                `)
                .eq('week_start_date', lastWeekStart)
                .maybeSingle();

            // 3. Render template
            html = generateWeeklyDigestEmail({
                ideas: validIdeas,
                winner: lastWeekBatch?.winner,
                threadCount: 2500, // Placeholder for web view
                weekDate: new Date(weekStart).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }),
                id: weekStart
            });

            // Personalization placeholders for web view
            html = html
                .replace(/\{\{name\}\}/g, 'there')
                .replace(/\{\{email\}\}/g, 'yours@example.com')
                .replace(/\{\{token\}\}/g, 'demo-token');

        } else if (type === 'welcome') {
            html = generateWelcomeEmail({
                name: 'there',
                email: 'yours@example.com'
            });
        } else if (type === 'magic-link') {
            html = generateMagicLinkEmail({
                email: 'yours@example.com',
                actionLink: '#',
                name: 'there'
            });
        } else {
            return res.status(400).send('Invalid email type.');
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error rendering email view:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;

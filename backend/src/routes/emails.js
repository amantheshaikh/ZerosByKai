import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
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

        if (type === 'welcome') {
            html = generateWelcomeEmail({
                name: 'there',
                email: 'yours@example.com',
                token: 'preview-token'
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

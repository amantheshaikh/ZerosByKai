
import { Resend } from 'resend';
import { generateMagicLinkEmail } from '../emails/templates.js';
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

async function simulateMagicLinkEmail() {
    console.log('Starting magic link email simulation...');

    const targetEmail = 'amantheshaikh@gmail.com';
    // This is a dummy link, strictly for visual verification of the email template
    const magicLink = 'https://zerosbykai.com/confirm?token=verification_simulation_token&type=magiclink';

    // 1. Generate HTML
    const html = generateMagicLinkEmail({
        email: targetEmail,
        actionLink: magicLink
    });

    // 2. Send Email
    console.log(`Sending simulated magic link email to ${targetEmail}...`);

    try {
        await resend.emails.send({
            from: 'Kai <kai@zerosbykai.com>',
            reply_to: 'kai@zerosbykai.com',
            to: targetEmail,
            subject: `[SIMULATION] Your Magic Link`,
            html: html
        });
        console.log('Simulation magic link email sent successfully!');
    } catch (e) {
        console.error('Failed to send simulation magic link email:', e);
    }
}

simulateMagicLinkEmail();

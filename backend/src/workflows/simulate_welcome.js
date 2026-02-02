
import { Resend } from 'resend';
import { generateWelcomeEmail } from '../emails/templates.js';
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

async function simulateWelcomeEmail() {
    console.log('Starting welcome email simulation...');

    const targetEmail = 'amantheshaikh@gmail.com';
    const targetName = 'Aman'; // Optional name

    // 1. Generate HTML
    const html = generateWelcomeEmail({
        name: targetName,
        email: targetEmail
    });

    // 2. Send Email
    console.log(`Sending simulated welcome email to ${targetEmail}...`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kai <kai@zerosbykai.com>',
            reply_to: 'kai@zerosbykai.com',
            to: targetEmail,
            subject: `[SIMULATION] Welcome to ZerosByKai`,
            html: html
        });

        if (error) {
            console.error('❌ Failed to send simulation welcome email:', error);
        } else {
            console.log('✅ Simulation welcome email sent successfully!', data);
        }
    } catch (e) {
        console.error('❌ Unexpected error in simulation script:', e);
    }
}

simulateWelcomeEmail();

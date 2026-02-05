import { generateWelcomeEmail } from '../emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../emails/templates/magic-link.js';
import { generateWeeklyDigestEmail } from '../emails/templates/weekly-digest.js';
import { sendEmail } from '../utils/emailService.js';
import { config } from '../config/env.js';
import { ADMIN_CONFIG } from '../utils/helpers.js';

const targetEmail = process.argv[2] || ADMIN_CONFIG.email;

if (!targetEmail) {
    console.error('Usage: node src/workflows/preview_templates.js <your-email>');
    process.exit(1);
}

async function previewTemplates() {
    console.log(`📧 Sending preview emails to: ${targetEmail}`);

    // 1. Welcome Email
    console.log('Sending Welcome Email...');
    await sendEmail({
        to: targetEmail,
        subject: '[Preview] Welcome to ZerosByKai',
        html: generateWelcomeEmail({ name: 'Preview User' }),
        tags: ['preview', 'welcome']
    });

    // 2. Magic Link
    console.log('Sending Magic Link...');
    await sendEmail({
        to: targetEmail,
        subject: '[Preview] Your Magic Link',
        html: generateMagicLinkEmail({
            email: targetEmail,
            actionLink: 'https://zerosbykai.com/auth/callback?token=preview-token',
            name: 'Preview User'
        }),
        tags: ['preview', 'magic-link']
    });

    // 3. Weekly Digest
    console.log('Sending Weekly Digest...');
    // Mock data for weekly digest
    const mockIdeas = [
        { title: 'AI-Powered T-Shirt Folder', name: 'FoldAI' },
        { title: 'Uber for Dog Walking in Rain', name: 'DryPaws' },
        { title: 'LinkedIn for Cats', name: 'MeowLink' }
    ];
    await sendEmail({
        to: targetEmail,
        subject: '[Preview] Weekly Digest: 3 New Ideas',
        html: generateWeeklyDigestEmail({
            ideas: mockIdeas,
            weekDate: new Date().toLocaleDateString(),
            winner: { title: 'Last Week Winner', name: 'WinApp', vote_count: 42 },
            badgeCount: 5,
            name: 'Preview User'
        }),
        tags: ['preview', 'weekly-digest']
    });

    console.log('✅ All previews sent! Check your inbox.');
}

previewTemplates().catch(console.error);

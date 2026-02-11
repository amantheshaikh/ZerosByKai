import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { brevoClient } from '../config/brevo.js';
import { config } from '../config/env.js';
import { sendBatchEmails } from '../utils/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Manage Brevo Template Script
 * Usage:
 *   node src/scripts/manage_templates.js <command> [options]
 *
 * Commands:
 *   create              Create a NEW template
 *   update [id]         Update existing template (defaults to env var ID)
 *   test-send [email]   Send test email with local HTML content
 */

async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];

    if (!['create', 'update', 'test-send'].includes(command)) {
        console.log('Usage: node src/scripts/manage_templates.js <create|update [id]|test-send [email]>');
        process.exit(1);
    }

    try {
        // 1. Read & Sanitize Template
        const templatePath = path.join(__dirname, '../emails/templates/brevo_template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Sanitize: Ensure no newlines within {{ }} tags (Brevo requirement)
        htmlContent = htmlContent.replace(/\{\{([\s\S]*?)\}\}/g, (match, p1) => {
            return `{{${p1.replace(/\s+/g, ' ').trim()}}}`;
        });

        console.log(`📄 Loaded template (Size: ${htmlContent.length} bytes)`);

        // 2. Execute Command
        if (command === 'create') {
            await createTemplate(htmlContent);
        } else if (command === 'update') {
            const templateId = arg ? parseInt(arg, 10) : parseInt(process.env.BREVO_WEEKLY_DIGEST_TEMPLATE_ID, 10);
            if (!templateId || isNaN(templateId)) {
                throw new Error('Template ID is required for update. Provide as argument or set BREVO_WEEKLY_DIGEST_TEMPLATE_ID.');
            }
            await updateTemplate(templateId, htmlContent);
        } else if (command === 'test-send') {
            const recipientEmail = arg || config.admin.email;
            if (!recipientEmail) {
                throw new Error('Recipient email is required for test-send. Provide as argument or set ADMIN_EMAIL.');
            }
            await sendTestEmail(recipientEmail, htmlContent);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.body) console.error('API Response:', JSON.stringify(error.body, null, 2));
        process.exit(1);
    }
}

async function createTemplate(htmlContent) {
    console.log('🚀 Creating New Brevo Template...');

    const smtpTemplate = {
        tag: 'weekly-digest',
        sender: {
            name: config.admin.name || 'ZerosByKai',
            email: config.admin.email || 'hello@zerosbykai.com'
        },
        templateName: 'Weekly Digest (Automated)',
        htmlContent: htmlContent,
        subject: "Kai's Zeros: 10 New Opportunities",
        isActive: true,
        replyTo: config.admin.email || 'hello@zerosbykai.com',
        toField: '{{contact.FIRSTNAME}}'
    };

    const data = await brevoClient.createSmtpTemplate(smtpTemplate);
    const templateId = data.id || (data.body && data.body.id);

    console.log(`✅ Success! Created Template ID: ${templateId}`);
    console.log(`📌 Add to .env: BREVO_WEEKLY_DIGEST_TEMPLATE_ID=${templateId}`);
}

async function updateTemplate(templateId, htmlContent) {
    console.log(`🚀 Updating Brevo Template ID: ${templateId}...`);

    const smtpTemplate = {
        templateName: 'Weekly Digest (Updated via Script)',
        htmlContent: htmlContent,
        subject: "Kai's Zeros: 10 New Opportunities",
        sender: {
            name: config.admin.name || 'ZerosByKai',
            email: config.admin.email || 'hello@zerosbykai.com'
        },
        replyTo: config.admin.email || 'hello@zerosbykai.com',
        toField: '{{contact.FIRSTNAME}}',
        isActive: true
    };

    await brevoClient.updateSmtpTemplate(templateId, smtpTemplate);
    console.log(`✅ Success! Updated Template ID: ${templateId}`);
}

async function sendTestEmail(email, htmlContent) {
    console.log(`📤 Sending Test Email with Local HTML to: ${email}...`);

    const testRecipients = [{
        to: email,
        params: {
            name: 'Tester',
            subject: 'Test: ' + new Date().toISOString(),
            weekDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            threadCount: '2,500',
            ideasCount: 2,
            voteUrl: `${config.frontendUrl}?token=test-token`,
            unsubscribeUrl: `${config.frontendUrl}/unsubscribe?email=${email}&token=test-token`,
            mirrorLinkUrl: `${config.frontendUrl}/view/weekly/test`,
            frontendUrl: config.frontendUrl,
            winner: {
                name: 'Last Week Winner',
                title: 'A great idea that won'
            },
            ideas: [
                {
                    name: 'Idea 1 (Test)',
                    title: 'Test Problem Statement',
                    problem: 'This is a test problem description to verify rendering.',
                    solution: 'This is a test solution description to verify rendering.',
                    index_plus_one: 1,
                    tags: { region: 'Global', category: 'SaaS' }
                },
                {
                    name: 'Idea 2 (Test)',
                    title: 'Another Problem',
                    problem: 'Second problem for layout check.',
                    solution: 'Second solution for layout check.',
                    index_plus_one: 2,
                    tags: { region: 'USA' }
                }
            ]
        }
    }];

    const result = await sendBatchEmails(testRecipients, {
        htmlContent, // Use the local HTML content explicitly
        subject: "Test - Direct HTML Send",
        tags: ['test-verification']
    });

    if (result.success) {
        console.log('✅ Test email sent successfully! Check your inbox.');
    } else {
        throw new Error(`Failed to send test email: ${result.error}`);
    }
}

// Run the script
main();

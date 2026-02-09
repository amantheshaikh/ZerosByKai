import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendBatchEmails } from '../utils/emailService.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBrevoTemplate() {
    console.log('🧪 Starting Brevo HTML Content Verification Test...');

    const templatePath = path.join(__dirname, '../emails/templates/brevo_template.html');
    if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template file not found at ${templatePath}`);
        process.exit(1);
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Sanitize: Ensure no newlines within {{ }} tags
    htmlContent = htmlContent.replace(/\{\{([\s\S]*?)\}\}/g, (match, p1) => {
        return `{{${p1.replace(/\s+/g, ' ').trim()}}}`;
    });

    console.log(`TYPE: Local HTML Template (Size: ${htmlContent.length} bytes)`);

    const testRecipients = [
        {
            to: config.admin.email || 'test@example.com',
            // Structure params exactly as weekly.js does
            params: {
                name: 'Tester',
                subject: 'Test: ' + new Date().toISOString(),
                weekDate: 'February 9, 2026',
                threadCount: '2,500',
                ideasCount: 2,
                voteUrl: 'https://zerosbykai.com?token=test-token',
                unsubscribeUrl: 'https://zerosbykai.com/unsubscribe?email=test@example.com&token=test-token',
                mirrorLinkUrl: 'https://zerosbykai.com/view/weekly/2026-02-09',
                frontendUrl: 'https://zerosbykai.com',
                winner: {
                    name: 'Last Week Winner',
                    title: 'A great idea that won'
                },
                ideas: [
                    {
                        name: 'Idea 1',
                        title: 'Problem 1',
                        problem: 'This is a test problem.',
                        solution: 'This is a test solution.',
                        index_plus_one: 1,
                        tags: { region: 'Global', category: 'SaaS' }
                    },
                    {
                        name: 'Idea 2',
                        title: 'Problem 2',
                        problem: 'Another problem.',
                        solution: 'Another solution.',
                        index_plus_one: 2,
                        tags: { region: 'USA' }
                    }
                ]
            }
        }
    ];

    try {
        console.log('📤 Sending test email to Brevo with HTML content...');
        const result = await sendBatchEmails(testRecipients, {
            htmlContent,
            subject: "Test - Direct HTML Send",
            tags: ['test-verification']
        });

        if (result.success) {
            console.log('✅ Test email sent successfully! Please check your inbox.');
        } else {
            console.error('❌ Test email failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error during test:', error.message);
    }
}

testBrevoTemplate();

import { sendBatchEmailsWithTemplate } from '../utils/emailService.js';
import { config } from '../config/env.js';

async function testBrevoTemplate() {
    console.log('🧪 Starting Brevo Template Verification Test...');

    const templateId = config.brevo.weeklyDigestTemplateId;
    if (!templateId) {
        console.error('❌ Error: BREVO_WEEKLY_DIGEST_TEMPLATE_ID is not set in environment.');
        process.exit(1);
    }

    console.log(`📡 Using Template ID: ${templateId}`);

    const testRecipients = [
        {
            to: config.admin.email || 'test@example.com',
            params: {
                name: 'Tester',
                weekDate: 'February 9, 2026',
                threadCount: '2,500',
                ideasCount: 3,
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
        console.log('📤 Sending test email to Brevo...');
        const result = await sendBatchEmailsWithTemplate(testRecipients, {
            templateId,
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

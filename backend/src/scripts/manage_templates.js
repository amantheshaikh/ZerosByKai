import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { brevoClient, webhooksApi } from '../config/brevo.js';
import { config } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateWelcomeEmail } from '../emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../emails/templates/magic-link.js';
import { sendEmail, sendBatchEmails } from '../utils/emailService.js';
import { generateEmailToken } from '../utils/emailToken.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Manage Brevo Template Script
 * Usage:
 *   node src/scripts/manage_templates.js <command> [options]
 *
 * Commands:
 *   create              Create a NEW template
 *   update [id]         Update existing template (defaults to env var ID)
 *   preview [email]     Send preview emails (Welcome & Magic Link) to target email
 *   webhooks            Register/Update Brevo webhooks for the production API
 *   simulate            Send a real weekly digest to 3 test emails (read-only, no DB changes)
 */

/*
### 9. Consolidated Template Management
- **Primary Script**: All template operations are now handled by `backend/src/scripts/manage_templates.js`.
- **Admin Email**: The system-wide default is now set to `kai@zerosbykai.com`.
- **Key Commands**:
    - `node src/scripts/manage_templates.js update 3`: Syncs local HTML to Brevo ID 3.
- **Redundancy Removed**: The temporary `update-brevo-template.js` has been deleted.

## Final Verification
- **Unit Tests**: All 147 tests passed.
- **Dry Run**: `npm run dry-run-weekly` successfully logs the optimized payload and follows the new subject logic.
- **Brevo Sync**: Template ID 3 is 100% in sync with your local `brevo_template.html`.
*/

async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];

    if (!['create', 'update', 'preview', 'webhooks', 'simulate'].includes(command)) {
        console.log('Usage: node src/scripts/manage_templates.js <create|update [id]|preview [email]|webhooks|simulate>');
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
        } else if (command === 'preview') {
            const targetEmail = arg || config.admin.email;
            if (!targetEmail) {
                throw new Error('Target email is required for preview.');
            }
            await sendPreviews(targetEmail);
        } else if (command === 'webhooks') {
            await registerWebhooks();
        } else if (command === 'simulate') {
            await simulateWeekly();
        }
    } catch (error) {
        console.error('❌ Detailed Error:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.statusCode || error.response.status);
            console.error('❌ Body:', JSON.stringify(error.response.body || error.response.data || {}, null, 2));
        } else if (error.body) {
            console.error('❌ Body:', JSON.stringify(error.body, null, 2));
        }
        process.exit(1);
    }
}

async function createTemplate(htmlContent) {
    console.log('🚀 Creating New Brevo Template...');

    const smtpTemplate = {
        tag: 'weekly-digest',
        sender: {
            name: config.admin.name || 'ZerosByKai',
            email: config.admin.email || 'kai@zerosbykai.com'
        },
        templateName: 'Weekly Digest (Automated)',
        htmlContent: htmlContent,
        subject: "Kai's Zeros: 10 New Opportunities",
        isActive: true,
        replyTo: config.admin.email || 'kai@zerosbykai.com',
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
            email: config.admin.email || 'kai@zerosbykai.com'
        },
        replyTo: config.admin.email || 'kai@zerosbykai.com',
        toField: '{{contact.FIRSTNAME}}',
        isActive: true
    };

    await brevoClient.updateSmtpTemplate(templateId, smtpTemplate);
    console.log(`✅ Success! Updated Template ID: ${templateId}`);
}

async function registerWebhooks() {
    const productionUrl = "https://zerosbykai-api-prod.fly.dev";
    const webhookPath = "/api/webhooks/brevo";
    const secret = config.brevo.webhookSecret;

    if (!secret) {
        throw new Error("BREVO_WEBHOOK_SECRET is not set in your environment.");
    }

    const fullUrl = `${productionUrl}${webhookPath}?token=${secret}`;
    console.log(`🚀 Registering Webhooks at: ${fullUrl}`);

    try {
        let webhooks = [];
        try {
            const { body: existingWebhooks } = await webhooksApi.getWebhooks();
            webhooks = existingWebhooks.webhooks || [];
        } catch (e) {
            const errorStatus = e?.response?.status;
            const errorCode = e?.response?.data?.code || e?.response?.body?.code;
            if (errorStatus === 400 && errorCode === 'document_not_found') {
                console.log("ℹ️ No existing webhooks found.");
            } else {
                throw e;
            }
        }

        const marketingExists = webhooks.find(w => w.url === fullUrl && w.type === 'marketing');
        const transactionalExists = webhooks.find(w => w.url === fullUrl && w.type === 'transactional');

        // Marketing Webhook (contactDeleted, unsubscribed)
        const marketingEvents = ["contactDeleted", "unsubscribed"];
        if (!marketingExists) {
            await webhooksApi.createWebhook({ url: fullUrl, events: marketingEvents, type: "marketing" });
            console.log("✅ Marketing Webhook created!");
        } else {
            await webhooksApi.updateWebhook(marketingExists.id, { events: marketingEvents });
            console.log("✅ Marketing Webhook updated!");
        }

        // Transactional Webhook (unsubscribed)
        const transactionalEvents = ["unsubscribed"];
        if (!transactionalExists) {
            await webhooksApi.createWebhook({ url: fullUrl, events: transactionalEvents, type: "transactional" });
            console.log("✅ Transactional Webhook created!");
        }

        console.log("✨ Webhook registration complete!");
    } catch (error) {
        throw error;
    }
}

async function sendPreviews(targetEmail) {
    console.log(`📧 Sending preview emails to: ${targetEmail}`);

    // 1. Welcome Email
    console.log('  🔹 Sending Welcome Email...');
    await sendEmail({
        to: targetEmail,
        subject: '[Preview] Welcome to ZerosByKai',
        html: generateWelcomeEmail({ name: 'Preview User', email: targetEmail, token: 'preview-token' }),
        tags: ['preview', 'welcome']
    });

    // 2. Magic Link
    console.log('  🔹 Sending Magic Link...');
    await sendEmail({
        to: targetEmail,
        subject: '[Preview] Your Magic Link',
        html: generateMagicLinkEmail({
            email: targetEmail,
            actionLink: `${config.frontendUrl}/auth/callback?token=preview-token`,
            name: 'Preview User'
        }),
        tags: ['preview', 'magic-link']
    });

    console.log('✅ All previews sent! Check your inbox.');
}

async function simulateWeekly() {
    const TEST_RECIPIENTS = [
        'amantheshaikh@gmail.com',
        'amudino@gmail.com',
        'amanshaikh2024@u.northwestern.edu'
    ];

    console.log('='.repeat(60));
    console.log('  SIMULATION MODE — No database changes will be made.');
    console.log(`  Sending to ${TEST_RECIPIENTS.length} test recipients only.`);
    console.log('  WARNING: Unsubscribe links are real — do NOT click them.');
    console.log('='.repeat(60) + '\n');

    // Dates: simulate what next Monday's email will look like
    const currentMonday = getMonday();
    const nextMonday = getMonday(new Date(new Date(currentMonday + 'T00:00:00Z').getTime() + 8 * 86400000));
    console.log(`📅 Simulating email for: ${nextMonday} (current week: ${currentMonday})`);

    // 1. Fetch ideas scheduled for next week (we don't flip status)
    const { data: ideas, error: ideasError } = await supabaseAdmin
        .from('ideas')
        .select('*')
        .eq('week_published', nextMonday)
        .in('status', ['scheduled', 'published'])
        .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
        throw new Error(`No scheduled/published ideas for ${nextMonday}. Run \`npm run schedule\` first.`);
    }

    console.log(`✅ Found ${ideas.length} ideas for ${nextMonday}`);

    // 2. Calculate this week's winner from live votes (read-only, no DB writes)
    //    This is "last week's winner" from next Monday's perspective.
    console.log(`\n🏆 Calculating winner for current week (${currentMonday})...`);

    const { data: currentWeekIdeas, error: cwError } = await supabaseAdmin
        .from('ideas')
        .select('id, name, title')
        .eq('week_published', currentMonday)
        .in('status', ['published', 'archived']);

    if (cwError) throw cwError;

    let simulatedWinner = null;
    if (currentWeekIdeas && currentWeekIdeas.length > 0) {
        const ideaVotes = [];
        for (const idea of currentWeekIdeas) {
            const { count, error } = await supabaseAdmin
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('idea_id', idea.id);
            if (error) throw error;
            ideaVotes.push({ ...idea, voteCount: count || 0 });
        }

        const totalVotes = ideaVotes.reduce((sum, i) => sum + i.voteCount, 0);
        if (totalVotes > 0) {
            ideaVotes.sort((a, b) => b.voteCount - a.voteCount || new Date(a.created_at) - new Date(b.created_at));
            simulatedWinner = ideaVotes[0];
            console.log(`   Winner: ${simulatedWinner.name} (${simulatedWinner.voteCount}/${totalVotes} votes)`);
            ideaVotes
                .forEach(i => console.log(`   ${i.voteCount === maxVotes ? '→' : ' '} ${i.name}: ${i.voteCount} votes`));
        } else {
            console.log('   No votes cast yet — winner section will be omitted.');
        }
    } else {
        console.log('   No published ideas found for current week.');
    }

    // 3. Resolve subject line (same cascade as weekly.js)
    const { data: currentBatch } = await supabaseAdmin
        .from('weekly_batches')
        .select('subject_line')
        .eq('week_start_date', nextMonday)
        .maybeSingle();

    let emailSubject;
    const ideaWithSubject = ideas.find(i => i.subject);
    const defaultSubject = `Kai's Zeros: Week of ${new Date(nextMonday + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    if (currentBatch?.subject_line) {
        emailSubject = currentBatch.subject_line;
        console.log(`\n📌 Subject (batch): "${emailSubject}"`);
    } else if (ideaWithSubject?.subject) {
        emailSubject = ideaWithSubject.subject;
        console.log(`\n📌 Subject (idea): "${emailSubject}"`);
    } else {
        emailSubject = defaultSubject;
        console.log(`\n📌 Subject (default): "${emailSubject}"`);
    }

    // 4. Look up test recipients in subscribers table for real name/user_id
    const { data: realSubscribers } = await supabaseAdmin
        .from('subscribers')
        .select('email, name, user_id')
        .in('email', TEST_RECIPIENTS);

    const subscriberMap = new Map((realSubscribers || []).map(s => [s.email, s]));

    const testSubscribers = TEST_RECIPIENTS.map(email => {
        const real = subscriberMap.get(email);
        return { email, name: real?.name || 'Test User', user_id: real?.user_id || null };
    });

    console.log('\n📋 Recipients:');
    testSubscribers.forEach(s => {
        const source = subscriberMap.has(s.email) ? 'DB' : 'mock';
        console.log(`   ${s.email} (${s.name}, ${s.user_id ? 'has account' : 'newsletter-only'}) [${source}]`);
    });

    // 5. Build params (identical structure to weekly.js)
    const formatTags = (tags) => Array.isArray(tags) ? tags : [];
    const threadCount = 2100 + Math.floor(Math.random() * 450);
    const templateId = config.brevo.weeklyDigestTemplateId;
    if (!templateId) {
        throw new Error('Missing BREVO_WEEKLY_DIGEST_TEMPLATE_ID in environment');
    }

    const globalParams = {
        weekDate: new Date(nextMonday + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        threadCount: threadCount.toLocaleString(),
        ideasCount: ideas.length,
        mirrorLinkUrl: `${config.frontendUrl}/view/weekly/${nextMonday}`,
        frontendUrl: config.frontendUrl,
        winner: simulatedWinner ? {
            name: simulatedWinner.name,
            title: simulatedWinner.title
        } : null,
        ideas: ideas.map((idea, idx) => ({
            name: idea.name,
            title: idea.title,
            problem: idea.problem,
            solution: idea.solution,
            index_plus_one: idx + 1,
            tags: formatTags(idea.tags)
        }))
    };

    const chunkParams = testSubscribers.map(subscriber => {
        const token = generateEmailToken(subscriber.user_id || subscriber.email, subscriber.email);
        let voteUrl = `${config.frontendUrl}?utm_source=email`;
        if (subscriber.user_id) {
            voteUrl += `&token=${encodeURIComponent(token)}`;
        }
        const unsubscribeUrl = `${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(token)}`;

        return {
            to: subscriber.email,
            params: { name: subscriber.name || 'Hustler', voteUrl, unsubscribeUrl },
            headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
        };
    });

    // 6. Send (real emails, no DB writes)
    console.log(`\n🚀 Sending simulation batch (${chunkParams.length} recipients)...`);

    const result = await sendBatchEmails(chunkParams, {
        templateId,
        subject: `[SIM] ${emailSubject}`,
        tags: ['weekly-digest-sim'],
        globalParams,
        idempotencyKey: `sim-${nextMonday}-${Date.now()}`
    });

    console.log(`\n📊 Result: ${result.successCount} sent, ${result.failCount} failed.`);
    if (!result.success) {
        console.error('❌ Error:', result.error);
    }
    console.log('✅ Simulation complete. No database changes were made.');
}

// Run the script
main();

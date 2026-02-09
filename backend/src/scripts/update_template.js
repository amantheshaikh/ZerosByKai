import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

async function updateWeeklyTemplate(templateId) {
    console.log(`🚀 Updating Brevo Template ID: ${templateId}...`);

    try {
        // 1. Read the template HTML
        const templatePath = path.join(__dirname, '../emails/templates/brevo_template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // 1.5 Sanitize: Ensure no newlines within {{ }} tags (Brevo requirement)
        htmlContent = htmlContent.replace(/\{\{([\s\S]*?)\}\}/g, (match, p1) => {
            return `{{${p1.replace(/\s+/g, ' ').trim()}}}`;
        });

        // 2. Prepare Template Data
        const smtpTemplate = {
            templateName: 'Weekly Digest (Updated via Script)',
            htmlContent: htmlContent,
            subject: "Kai's Zeros: 10 New Opportunities",
            sender: {
                name: process.env.ADMIN_NAME || 'ZerosByKai',
                email: process.env.ADMIN_EMAIL || 'hello@zerosbykai.com'
            },
            replyTo: process.env.ADMIN_EMAIL || 'hello@zerosbykai.com',
            toField: '{{contact.FIRSTNAME}}', // Helps Brevo preview
            isActive: true
        };

        // 3. Call Brevo API
        console.log('📡 Sending update request to Brevo...');
        await apiInstance.updateSmtpTemplate(templateId, smtpTemplate);

        console.log(`✅ Success! Updated Brevo Template ID: ${templateId}`);
    } catch (error) {
        console.error('❌ Failed to update Brevo Template:');
        console.error(error.body || error.message);
        process.exit(1);
    }
}

// Get ID from arg or env
const idToUpdate = process.argv[2] || process.env.BREVO_WEEKLY_DIGEST_TEMPLATE_ID;

if (!idToUpdate) {
    console.error('Please provide a template ID as an argument or set BREVO_WEEKLY_DIGEST_TEMPLATE_ID');
    process.exit(1);
}

updateWeeklyTemplate(parseInt(idToUpdate, 10));

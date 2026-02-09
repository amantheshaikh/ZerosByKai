import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { brevoClient } from '../config/brevo.js';
import { config } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createWeeklyTemplate() {
    console.log('🚀 Starting Automated Brevo Template Creation...');

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

        // 3. Call Brevo API
        console.log('📡 Sending request to Brevo...');
        const data = await brevoClient.createSmtpTemplate(smtpTemplate);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        const templateId = data.body ? data.body.id : data.id;
        console.log(`✅ Success! Created Brevo Template with ID: ${templateId}`);
        console.log(`📌 Please add this to your environment: BREVO_WEEKLY_DIGEST_TEMPLATE_ID=${templateId}`);

        return templateId;
    } catch (error) {
        console.error('❌ Failed to create Brevo Template:');
        console.dir(error, { depth: null });
        process.exit(1);
    }
}

createWeeklyTemplate();

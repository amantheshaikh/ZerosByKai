import { brevoClient } from '../config/brevo.js';
import { config } from '../config/env.js';

/**
 * Sends a single transactional email via Brevo.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} [params.text] - Optional plain text version
 * @param {string[]} [params.tags] - Optional tags for tracking
 * @param {Object} [params.headers] - Optional custom headers
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function sendEmail({ to, subject, html, text, tags, headers, params }) {
    try {
        const sendSmtpEmail = {
            to: [{ email: to }],
            sender: {
                name: config.admin.name || 'ZerosByKai',
                email: config.admin.email || 'hello@zerosbykai.com'
            },
            subject,
            htmlContent: html,
            ...(text && { textContent: text }),
            ...(tags && { tags }),
            ...(headers && { headers }),
            ...(params && { params })
        };

        const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error(`❌ Brevo sendEmail error for ${to}:`, error.response?.body || error.message);
        return { success: false, error: error.response?.body || error.message };
    }
}

/**
 * Sends a single transactional email via Brevo using a TEMPLATE.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {number} params.templateId - Brevo Template ID
 * @param {Object} params.params - Template variables
 * @param {string[]} [params.tags] - Optional tags for tracking
 * @param {Object} [params.headers] - Optional custom headers
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function sendEmailWithTemplate({ to, templateId, params, subject, tags, headers }) {
    try {
        const sendSmtpEmail = {
            to: [{ email: to }],
            templateId,
            params,
            ...(subject && { subject }),
            ...(tags && { tags }),
            ...(headers && { headers })
        };

        const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error(`❌ Brevo sendEmailWithTemplate error for ${to}:`, error.response?.body || error.message);
        return { success: false, error: error.response?.body || error.message };
    }
}

/**
 * Sends a batch of personalized emails using either a Template ID or direct HTML.
 * 
 * @param {Array} chunk - Array of { to, params }
 * @param {Object} options - Shared options like templateId, htmlContent, tags, headers
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendBatchEmails(chunk, options = {}) {
    if (!options.templateId && !options.htmlContent) {
        throw new Error('sendBatchEmails: Missing templateId or htmlContent');
    }

    try {
        // Brevo's sendTransacEmail can send to multiple recipients with DIFFERENT params
        // only if we send multiple distinct messages in one call, or use iterate.
        // Actually, Brevo SDK's sendTransacEmail accepts a single object which represents ONE email 
        // that can have multiple 'to' recipients, but they all share the same 'params'.
        // For individual personalization (per-recipient params), we must iterate 
        // or use their Batch API (v3/smtp/email/batch) which supports individual params.

        // Note: The standard SDK might not have a direct 'sendBatch' that supports individual params 
        // in a single call in older versions, but the API itself does.
        // We'll use Promise.allSettled for now to ensure 
        // individual parameters like 'token' and 'name' are correctly mapped.

        const sendPath = options.templateId ? 'TEMPLATE' : 'HTML';
        console.log(`📧 sendBatchEmails: path=${sendPath}, templateId=${options.templateId}, chunk=${chunk.length}, paramsKeys=${chunk[0] ? Object.keys(chunk[0].params || {}).join(',') : 'none'}`);

        const results = await Promise.allSettled(
            chunk.map(recipient => {
                if (options.templateId) {
                    return sendEmailWithTemplate({
                        to: recipient.to,
                        templateId: options.templateId,
                        params: recipient.params,
                        subject: options.subject,
                        tags: options.tags,
                        headers: recipient.headers || options.headers
                    });
                } else {
                    return sendEmail({
                        to: recipient.to,
                        html: options.htmlContent,
                        subject: options.subject,
                        params: recipient.params,
                        tags: options.tags,
                        headers: recipient.headers || options.headers
                    });
                }
            })
        );

        const failures = results.filter(r => r.status === 'rejected' || !r.value.success);

        if (failures.length > 0) {
            console.warn(`⚠️ Batch had ${failures.length} failures out of ${chunk.length}`);
        }

        return {
            success: failures.length < chunk.length,
            successCount: chunk.length - failures.length,
            failCount: failures.length
        };
    } catch (error) {
        console.error('❌ Brevo sendBatchEmails error:', error.message);
        return { success: false, successCount: 0, failCount: chunk.length, error: error.message };
    }
}

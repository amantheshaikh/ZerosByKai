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
export async function sendEmail({ to, subject, html, text, tags, headers }) {
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
            ...(headers && { headers })
        };

        const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error(`❌ Brevo sendEmail error for ${to}:`, error.body || error.message);
        return { success: false, error: error.body || error.message };
    }
}

/**
 * Sends a batch of personalized emails.
 * Note: While Brevo has a batch API, this implementation sends them 
 * effectively by processing the chunk to meet application needs.
 * 
 * @param {Array} chunk - Array of { to, subject, html, text }
 * @param {Object} options - Shared options like tags, headers
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendBatchEmails(chunk, options = {}) {
    try {
        // For high volume, we use the Brevo batch endpoint logic
        // We construct a single request for the chunk of 50
        const batchEmails = chunk.map(email => ({
            to: [{ email: email.to }],
            sender: {
                name: config.admin.name || 'ZerosByKai',
                email: config.admin.email || 'hello@zerosbykai.com'
            },
            subject: email.subject,
            htmlContent: email.html,
            textContent: email.text,
            ...(options.tags && { tags: options.tags }),
            ...(options.headers && { headers: options.headers })
        }));

        // sendTransacEmail can take multiple if configured, 
        // but Brevo's "batch" usually means sending to multiple recipients of the SAME email 
        // OR using the SMTP Relay.
        // For distinct personalized content per recipient in a single API call, 
        // we should iterate or use their specific batching if supported by the SDK version.

        // Most reliable way for personalized content in the current SDK setup:
        const results = await Promise.allSettled(
            chunk.map(email => sendEmail({ ...email, ...options }))
        );

        const failures = results.filter(r => r.status === 'rejected' || !r.value.success);

        if (failures.length > 0) {
            console.warn(`⚠️ Batch had ${failures.length} failures out of ${chunk.length}`);
        }

        return {
            success: failures.length < chunk.length // Success if at least one sent, or be stricter?
        };
    } catch (error) {
        console.error('❌ Brevo sendBatchEmails error:', error.message);
        return { success: false, error: error.message };
    }
}

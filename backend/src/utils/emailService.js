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
                email: config.admin.email || 'kai@zerosbykai.com'
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

    const MAX_RETRIES = 3;
    const INITIAL_BACKOFF = 1000; // 1 second
    // Use an idempotency key if provided, or generate a stable one from the chunk and template
    const idempotencyKey = options.idempotencyKey ||
        `batch-${options.templateId || 'html'}-${chunk[0].to}-${chunk.length}-${Date.now()}`;

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                const backoff = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
                console.log(`🔄 Retrying batch send (attempt ${attempt}/${MAX_RETRIES}) in ${backoff}ms...`);
                await new Promise(r => setTimeout(r, backoff));
            }
            const sendSmtpEmail = {
                sender: {
                    name: config.admin.name || 'ZerosByKai',
                    email: config.admin.email || 'kai@zerosbykai.com'
                },
                ...(options.templateId && { templateId: options.templateId }),
                ...(options.htmlContent && { htmlContent: options.htmlContent }),
                ...(options.subject && { subject: options.subject }),
                ...(options.tags && { tags: options.tags }),
                ...(options.headers && { headers: options.headers }),
                // Global defaults for all message versions
                ...(options.globalParams && { params: options.globalParams }),
                messageVersions: chunk.map(recipient => ({
                    to: [{ email: recipient.to, name: recipient.params?.name || 'Hustler' }],
                    // Per-recipient overrides
                    params: recipient.params,
                    ...(recipient.headers && { headers: recipient.headers }),
                    // Allow per-recipient subject override if present in params
                    ...(recipient.params?.subject && { subject: recipient.params.subject })
                }))
            };

            const data = await brevoClient.sendTransacEmail(sendSmtpEmail, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });

            // The Brevo SDK returns { response, body }. Message IDs are in body.
            const messageIds = data?.body?.messageIds || data?.messageIds || [];
            const acceptedCount = messageIds.length;
            const requestedCount = chunk.length;

            if (acceptedCount < requestedCount) {
                console.warn(`⚠️ Batch partial success: ${acceptedCount}/${requestedCount} accepted by Brevo.`);
            }

            return {
                success: true,
                successCount: acceptedCount,
                failCount: requestedCount - acceptedCount,
                messageIds,
                data
            };
        } catch (error) {
            lastError = error;
            const statusCode = error?.response?.status || error?.status;
            // Retry on 429, 5xx, or network errors (statusCode undefined)
            const isTransient = !statusCode || statusCode === 429 || (statusCode >= 500 && statusCode < 600);

            if (!isTransient || attempt === MAX_RETRIES) {
                const errorBody = error?.response?.body || error?.body || error.message;
                console.error(`❌ Brevo sendBatchEmails final error (status ${statusCode}):`, JSON.stringify(errorBody, null, 2));
                return { success: false, successCount: 0, failCount: chunk.length, error: errorBody };
            }
        }
    }
    // This part should ideally not be reached if the loop always returns or throws.
    // However, to satisfy the return type in case of an unexpected fall-through after retries,
    // we can return the last error.
    const errorBody = lastError?.response?.body || lastError?.body || lastError?.message || 'Unknown error after retries';
    return { success: false, successCount: 0, failCount: chunk.length, error: errorBody };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendEmailWithTemplate, sendBatchEmailsWithTemplate } from '../../src/utils/emailService.js';
import { brevoClient } from '../../src/config/brevo.js';
import { config } from '../../src/config/env.js';

// Mock Brevo config and API
vi.mock('../../src/config/brevo.js', () => ({
    brevoClient: {
        sendTransacEmail: vi.fn()
    }
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        admin: {
            name: 'Test Admin',
            email: 'admin@test.com'
        },
        brevo: {
            apiKey: 'mock-key'
        }
    }
}));

describe('emailService.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendEmail()', () => {
        const emailParams = {
            to: 'user@example.com',
            subject: 'Test Subject',
            html: '<p>Test Content</p>',
            text: 'Test Content',
            tags: ['test-tag']
        };

        it('should send an email successfully via Brevo', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '123' });

            const result = await sendEmail(emailParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ messageId: '123' });
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: [{ email: emailParams.to }],
                subject: emailParams.subject,
                htmlContent: emailParams.html,
                textContent: emailParams.text,
                tags: emailParams.tags,
                sender: {
                    name: config.admin.name,
                    email: config.admin.email
                }
            }));
        });

        it('should handle optional fields correctly', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '123' });

            const result = await sendEmail({
                to: 'user@example.com',
                subject: 'Minimal',
                html: 'Hello'
            });

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.not.objectContaining({
                textContent: expect.anything(),
                tags: expect.anything()
            }));
        });

        it('should handle Brevo API errors', async () => {
            const apiError = { response: { body: 'API Error' }, message: 'Something went wrong' };
            brevoClient.sendTransacEmail.mockRejectedValue(apiError);

            const result = await sendEmail(emailParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('API Error');
        });

        it('should fallback to error message if body is missing in error', async () => {
            const apiError = { message: 'Network Error' };
            brevoClient.sendTransacEmail.mockRejectedValue(apiError);

            const result = await sendEmail(emailParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network Error');
        });
    });

    describe('sendEmailWithTemplate()', () => {
        it('should send email with template ID and params', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '456' });

            const result = await sendEmailWithTemplate({
                to: 'user@example.com',
                templateId: 5,
                params: { name: 'Test User', weekDate: 'Feb 10, 2026' }
            });

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: [{ email: 'user@example.com' }],
                templateId: 5,
                params: { name: 'Test User', weekDate: 'Feb 10, 2026' }
            }));
        });

        it('should include subject override when provided', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '789' });

            await sendEmailWithTemplate({
                to: 'user@example.com',
                templateId: 5,
                params: { name: 'User' },
                subject: 'Custom Subject'
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                subject: 'Custom Subject'
            }));
        });

        it('should not include subject when not provided', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '789' });

            await sendEmailWithTemplate({
                to: 'user@example.com',
                templateId: 5,
                params: { name: 'User' }
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.not.objectContaining({ subject: expect.anything() })
            );
        });

        it('should pass tags and headers when provided', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '101' });

            await sendEmailWithTemplate({
                to: 'user@example.com',
                templateId: 5,
                params: {},
                tags: ['weekly-digest'],
                headers: { 'List-Unsubscribe': '<https://example.com/unsub>' }
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                tags: ['weekly-digest'],
                headers: { 'List-Unsubscribe': '<https://example.com/unsub>' }
            }));
        });

        it('should handle Brevo API errors', async () => {
            brevoClient.sendTransacEmail.mockRejectedValue({
                response: { body: 'Template Error' },
                message: 'Bad Request'
            });

            const result = await sendEmailWithTemplate({
                to: 'user@example.com',
                templateId: 5,
                params: {}
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Template Error');
        });
    });

    describe('sendBatchEmailsWithTemplate()', () => {
        const chunk = [
            { to: 'u1@example.com', params: { name: 'User1' } },
            { to: 'u2@example.com', params: { name: 'User2' } }
        ];

        it('should throw if templateId is missing', async () => {
            await expect(sendBatchEmailsWithTemplate(chunk, {}))
                .rejects.toThrow('Missing templateId');
        });

        it('should send all emails in batch successfully', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: 'ok' });

            const result = await sendBatchEmailsWithTemplate(chunk, { templateId: 5 });

            expect(result.success).toBe(true);
            expect(result.successCount).toBe(2);
            expect(result.failCount).toBe(0);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(2);
        });

        it('should handle partial failures and return accurate counts', async () => {
            brevoClient.sendTransacEmail
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValueOnce({ messageId: 'ok' });

            const result = await sendBatchEmailsWithTemplate(chunk, { templateId: 5 });

            expect(result.success).toBe(true);
            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(1);
        });

        it('should return success false if all emails fail', async () => {
            brevoClient.sendTransacEmail.mockRejectedValue(new Error('down'));

            const result = await sendBatchEmailsWithTemplate(chunk, { templateId: 5 });

            expect(result.success).toBe(false);
            expect(result.successCount).toBe(0);
            expect(result.failCount).toBe(2);
        });

        it('should pass subject and tags from options', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: 'ok' });

            await sendBatchEmailsWithTemplate(chunk, {
                templateId: 5,
                subject: 'Weekly Subject',
                tags: ['weekly-digest']
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                subject: 'Weekly Subject',
                tags: ['weekly-digest']
            }));
        });

        it('should prefer per-recipient headers over option headers', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: 'ok' });

            const chunkWithHeaders = [
                {
                    to: 'u1@example.com',
                    params: { name: 'User1' },
                    headers: { 'List-Unsubscribe': '<https://example.com/unsub/u1>' }
                }
            ];

            await sendBatchEmailsWithTemplate(chunkWithHeaders, {
                templateId: 5,
                headers: { 'X-Global': 'fallback' }
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                headers: { 'List-Unsubscribe': '<https://example.com/unsub/u1>' }
            }));
        });

        it('should fall back to option headers when recipient has none', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: 'ok' });

            const chunkNoHeaders = [
                { to: 'u1@example.com', params: { name: 'User1' } }
            ];

            await sendBatchEmailsWithTemplate(chunkNoHeaders, {
                templateId: 5,
                headers: { 'X-Global': 'value' }
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                headers: { 'X-Global': 'value' }
            }));
        });
    });
});

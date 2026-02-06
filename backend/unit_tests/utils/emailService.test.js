import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendBatchEmails } from '../../src/utils/emailService.js';
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
            const apiError = { body: 'API Error', message: 'Something went wrong' };
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

    describe('sendBatchEmails()', () => {
        const chunk = [
            { to: 'user1@example.com', subject: 'S1', html: 'H1' },
            { to: 'user2@example.com', subject: 'S2', html: 'H2' }
        ];

        it('should send batch emails successfully', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ success: true });

            const result = await sendBatchEmails(chunk, { tags: ['batch'] });

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(2);
        });

        it('should handle partial failures', async () => {
            // Mock sendTransacEmail to fail for the first email and succeed for the second
            brevoClient.sendTransacEmail
                .mockRejectedValueOnce(new Error('Failed First'))
                .mockResolvedValueOnce({ success: true });

            const result = await sendBatchEmails(chunk);

            expect(result.success).toBe(true); // Implementation considers it success if at least one sent
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(2);
        });

        it('should return success: false if all emails in batch fail', async () => {
            brevoClient.sendTransacEmail.mockRejectedValue(new Error('Total Failure'));

            const result = await sendBatchEmails(chunk);

            expect(result.success).toBe(false);
        });

        it('should handle top-level errors in sendBatchEmails', async () => {
            // Force an error that isn't caught by the Promise.allSettled inner catch
            // although the current implementation is quite robust.
            // If chunk map fails for some reason:
            const result = await sendBatchEmails(null);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

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

        it('should pass custom headers (List-Unsubscribe) to Brevo', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageId: '123' });

            const result = await sendEmail({
                ...emailParams,
                headers: {
                    'List-Unsubscribe': '<https://example.com/unsub>',
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            });

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(expect.objectContaining({
                headers: {
                    'List-Unsubscribe': '<https://example.com/unsub>',
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            }));
        });
    });


    describe('sendBatchEmails()', () => {
        const chunk = [
            { to: 'u1@example.com', params: { name: 'User1' } },
            { to: 'u2@example.com', params: { name: 'User2' } }
        ];

        it('should throw if templateId and htmlContent are missing', async () => {
            await expect(sendBatchEmails(chunk, {}))
                .rejects.toThrow('Missing templateId or htmlContent');
        });

        it('should send all emails in a single batch call successfully', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['id1', 'id2'] });

            const result = await sendBatchEmails(chunk, { templateId: 5 });

            expect(result.success).toBe(true);
            expect(result.successCount).toBe(2);
            expect(result.failCount).toBe(0);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(1);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateId: 5,
                    messageVersions: expect.arrayContaining([
                        expect.objectContaining({ to: [{ email: 'u1@example.com', name: 'User1' }] }),
                        expect.objectContaining({ to: [{ email: 'u2@example.com', name: 'User2' }] })
                    ])
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) })
                })
            );
        });

        it('should handle Brevo API errors for the entire batch', async () => {
            brevoClient.sendTransacEmail.mockRejectedValue({
                response: { body: 'Batch Error' },
                message: 'Bad Request'
            });

            const result = await sendBatchEmails(chunk, { templateId: 5 });

            expect(result.success).toBe(false);
            expect(result.successCount).toBe(0);
            expect(result.failCount).toBe(2);
            expect(result.error).toBe('Batch Error');
        });

        it('should pass global subject and tags to the batch request', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['ok'] });

            await sendBatchEmails(chunk, {
                templateId: 5,
                subject: 'Weekly Subject',
                tags: ['weekly-digest']
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Weekly Subject',
                    tags: ['weekly-digest']
                }),
                expect.objectContaining({
                    headers: { 'Idempotency-Key': expect.any(String) }
                })
            );
        });

        it('should include per-recipient headers and params in messageVersions', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['ok'] });

            const chunkWithExtras = [
                {
                    to: 'u1@example.com',
                    params: { name: 'User1', subject: 'Custom Hi' },
                    headers: { 'List-Unsubscribe': '<https://example.com/unsub/u1>' }
                }
            ];

            await sendBatchEmails(chunkWithExtras, {
                templateId: 5,
                headers: { 'X-Global': 'fallback' }
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: { 'X-Global': 'fallback' },
                    messageVersions: [
                        expect.objectContaining({
                            to: [{ email: 'u1@example.com', name: 'User1' }],
                            subject: 'Custom Hi',
                            headers: { 'List-Unsubscribe': '<https://example.com/unsub/u1>' }
                        })
                    ]
                }),
                expect.objectContaining({
                    headers: { 'Idempotency-Key': expect.any(String) }
                })
            );
        });

        it('should pass globalParams to the batch request', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['ok'] });

            const globalParams = { weeklyTitle: 'Shared Title', ideas: [1, 2, 3] };
            await sendBatchEmails(chunk, {
                templateId: 5,
                globalParams
            });

            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: globalParams
                }),
                expect.any(Object)
            );
        });

        it('should retry on transient errors (429, 5xx) and succeed if next attempt works', async () => {
            vi.useFakeTimers();
            const transientError = { status: 429, response: { body: 'Rate limit' } };

            brevoClient.sendTransacEmail
                .mockRejectedValueOnce(transientError)
                .mockResolvedValueOnce({ messageIds: ['id1', 'id2'] });

            const promise = sendBatchEmails(chunk, { templateId: 5 });

            // Fast-forward through backoff
            await vi.runAllTimersAsync();

            const result = await promise;

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(2);
            vi.useRealTimers();
        });

        it('should fail after maximum retries for transient errors', async () => {
            vi.useFakeTimers();
            const transientError = { status: 500, response: { body: 'Server Error' } };

            brevoClient.sendTransacEmail.mockRejectedValue(transientError);

            const promise = sendBatchEmails(chunk, { templateId: 5 });

            await vi.runAllTimersAsync();

            const result = await promise;

            expect(result.success).toBe(false);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
            vi.useRealTimers();
        });

        it('should NOT retry on non-transient errors (e.g., 400 Bad Request)', async () => {
            const fatalError = { status: 400, response: { body: 'Invalid Payload' } };
            brevoClient.sendTransacEmail.mockRejectedValue(fatalError);

            const result = await sendBatchEmails(chunk, { templateId: 5 });

            expect(result.success).toBe(false);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledTimes(1);
        });

        it('should work with htmlContent instead of templateId', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['id1', 'id2'] });

            const result = await sendBatchEmails(chunk, {
                htmlContent: '<html>{{params.name}}</html>',
                subject: 'Direct HTML'
            });

            expect(result.success).toBe(true);
            expect(brevoClient.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    htmlContent: '<html>{{params.name}}</html>',
                    subject: 'Direct HTML'
                }),
                expect.any(Object)
            );
            // Should NOT have templateId
            const callArgs = brevoClient.sendTransacEmail.mock.calls[0][0];
            expect(callArgs.templateId).toBeUndefined();
        });

        it('should handle partial success when acceptedCount < requestedCount', async () => {
            brevoClient.sendTransacEmail.mockResolvedValue({ messageIds: ['id1'] }); // Only 1 accepted out of 2

            const result = await sendBatchEmails(chunk, { templateId: 5 });

            expect(result.success).toBe(true);
            expect(result.successCount).toBe(1);
            expect(result.failCount).toBe(1);
        });
    });
});

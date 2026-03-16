import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateWinner, sendWeeklyDigest } from '../../src/jobs/weekly.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { sendBatchEmails } from '../../src/utils/emailService.js';

// Mock all internal dependencies
vi.mock('../../src/config/supabase.js', () => {
    const mock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockReturnThis(),
        // Standard thenable for await support
        then: vi.fn(function (resolve) {
            return Promise.resolve({ data: [], error: null }).then(resolve);
        })
    };
    return { supabaseAdmin: mock };
});

vi.mock('../../src/utils/emailToken.js', () => ({
    generateEmailToken: vi.fn(() => 'mock-token')
}));

vi.mock('../../src/utils/emailService.js', () => ({
    sendBatchEmails: vi.fn(() => Promise.resolve({ success: true, successCount: 1, failCount: 0 }))
}));

vi.mock('../../src/utils/dateUtils.js', () => ({
    getMonday: vi.fn(() => '2025-01-06'),
    getLastMonday: vi.fn(() => '2024-12-30')
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://localhost:3000',
        brevo: { weeklyDigestTemplateId: 99 }
    }
}));

describe('weekly.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        supabaseAdmin.then.mockReset();
        // Default success response
        supabaseAdmin.then.mockImplementation(function (resolve) {
            return Promise.resolve({ data: [], error: null }).then(resolve);
        });
    });

    describe('calculateWinner()', () => {
        it('should skip if winner already calculated', async () => {
            supabaseAdmin.then.mockImplementationOnce(function (resolve) {
                return Promise.resolve({ data: { id: 1, winner_calculated: true }, error: null }).then(resolve);
            });

            const result = await calculateWinner();
            expect(result).toEqual({ skipped: true });
        });

        it('should return undefined if no ideas found', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)); // getIdeas

            const result = await calculateWinner();
            expect(result).toBeUndefined();
        });

        it('should calculate winner and award badges correctly', async () => {
            const mockIdeas = [{ id: '1', name: 'Idea 1', title: 'Title 1', vote_count: 3 }];
            const mockVoters = [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // update winner flag
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // archive all
                .mockImplementationOnce(f => Promise.resolve({ data: mockVoters, error: null }).then(f)) // winning voters
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // badges
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f)); // batch upsert

            const result = await calculateWinner();

            expect(result.winner.id).toBe('1');
            expect(result.badgeCount).toBe(3);
        });

        it('should handle "no winner" case when there are no votes', async () => {
            const mockIdeas = [{ id: '1', name: 'Idea 1', vote_count: 0 }];
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // archive
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f)); // upsert batch

            const result = await calculateWinner();
            expect(result.winner).toBeNull();
        });

        it('should throw error if checkBatch fails', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: new Error('DB Error') }).then(f));
            await expect(calculateWinner()).rejects.toThrow('DB Error');
        });

        it('should throw error if winner status update fails', async () => {
            const mockIdeas = [{ id: '1', name: 'Idea 1', vote_count: 1 }];
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ error: new Error('Update Failed') }).then(f)); // update winner flag

            await expect(calculateWinner()).rejects.toThrow('Critical failure: Could not set winner status for 1');
        });
    });

    describe('sendWeeklyDigest()', () => {
        it('should exit if no ideas found', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)); // ideas

            const result = await sendWeeklyDigest();
            expect(result).toBeUndefined();
        });

        it('should skip if email already sent', async () => {
            supabaseAdmin.then.mockImplementationOnce(f =>
                Promise.resolve({ data: { id: 'b1', email_sent_at: '2025-01-01T00:00:00Z' }, error: null }).then(f)
            );

            const result = await sendWeeklyDigest();
            expect(result).toBeUndefined();
        });

        it('should publish ideas and send emails using pre-scheduled subject', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub', user_id: 'u1' }];
            const mockBatch = { id: 'batch1', subject_line: 'Custom Subject' };

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: mockBatch, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // update status
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // fetch ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeekBatch
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total subscriber count
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // subscribers (page 1)
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // subscribers (empty page 2 ends loop)
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch status update

            const result = await sendWeeklyDigest();

            expect(result.sent).toBe(1);
            expect(sendBatchEmails).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        to: 'sub@example.com',
                        params: expect.objectContaining({
                            name: 'Sub',
                            unsubscribeUrl: expect.stringContaining('/unsubscribe?email='),
                            voteUrl: expect.stringContaining('token=')
                        }),
                        headers: expect.objectContaining({
                            'List-Unsubscribe': expect.stringContaining('/unsubscribe?email='),
                            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                        })
                    })
                ]),
                expect.objectContaining({
                    templateId: 99,
                    subject: 'Custom Subject',
                    tags: ['weekly-digest'],
                    globalParams: expect.objectContaining({
                        ideasCount: 1,
                        ideas: expect.any(Array)
                    })
                })
            );
        });

        it('should use default subject if no subject_line in DB', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'b1' }, error: null }).then(f)) // currentBatch (no subject)
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total subscriber count
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // subscribers (page 1)
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // subscribers (page 2)
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch status update

            const result = await sendWeeklyDigest();
            expect(result.sent).toBe(1);
        });

        it('should log warning if failCount > 10%', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'f@e.com' }, { email: 'f2@e.com' }];
            sendBatchEmails.mockResolvedValueOnce({ success: true, successCount: 1, failCount: 1, error: { message: 'Partial failure' } });

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 2, error: null }).then(f)) // total
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // page 1
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // page 2
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // update

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            await sendWeeklyDigest();
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should throw error if fetching subscribers fails', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // batch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // count
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: new Error('Subs Fetch Failed') }).then(f)); // fetch page 1 fails

            await expect(sendWeeklyDigest()).rejects.toThrow('Subs Fetch Failed');
        });

        it('should throw error if subject resolution fails due to countErrorSubs', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // batch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 0, error: new Error('Count Error') }).then(f)); // count fails

            await expect(sendWeeklyDigest()).rejects.toThrow('Count Error');
        });

        it('should throw error if batch update at end fails', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // batch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // count
                .mockImplementationOnce(f => Promise.resolve({ data: [{ email: 't@t.com' }], error: null }).then(f)) // subs p1
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // subs p2
                .mockImplementationOnce(f => Promise.resolve({ error: { message: 'Final Update Failed' } }).then(f)); // final update

            await expect(sendWeeklyDigest()).rejects.toThrow('[FATAL] Failed to mark batch as sent');
        });

        it('should return early if no active subscribers', async () => {
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 0, error: null }).then(f)); // total = 0

            const result = await sendWeeklyDigest();
            expect(result).toBeUndefined();
            expect(sendBatchEmails).not.toHaveBeenCalled();
        });

        it('should generate voteUrl without token for newsletter-only subscribers', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'newsletter@example.com', name: 'Sub' }]; // no user_id

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // page 1
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // page 2
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch update

            await sendWeeklyDigest();

            expect(sendBatchEmails).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        to: 'newsletter@example.com',
                        params: expect.objectContaining({
                            voteUrl: expect.not.stringContaining('token=')
                        })
                    })
                ]),
                expect.any(Object)
            );
        });

        it('should include last week winner in globalParams when available', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub', user_id: 'u1' }];
            const lastWeekBatch = {
                id: 'lb1',
                winner: { name: 'WinnerApp', title: 'The Winner' }
            };

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: lastWeekBatch, error: null }).then(f)) // lastWeekBatch with winner
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // page 1
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // page 2
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch update

            await sendWeeklyDigest();

            expect(sendBatchEmails).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    globalParams: expect.objectContaining({
                        winner: { name: 'WinnerApp', title: 'The Winner' }
                    })
                })
            );
        });

        it('should set winner to null in globalParams when no last week winner', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // currentBatch
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek (no batch)
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // page 1
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // page 2
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch update

            await sendWeeklyDigest();

            expect(sendBatchEmails).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    globalParams: expect.objectContaining({
                        winner: null
                    })
                })
            );
        });

        it('should use subject from idea if no subject_line in weekly_batches', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', subject: 'Idea-Level Subject' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'b1' }, error: null }).then(f)) // currentBatch (no subject)
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // fetch ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeekBatch
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // total subscriber count
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // subscribers
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // empty 2nd page
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // update batch

            await sendWeeklyDigest();

            expect(sendBatchEmails).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    subject: 'Idea-Level Subject',
                    globalParams: expect.any(Object)
                })
            );
        });
    });
});

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
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
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
            const mockIdeas = [{ id: '1', name: 'Idea 1', title: 'Title 1' }];
            const mockVoters = [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ count: 3, error: null }).then(f)) // per-idea vote count (for Idea 1)
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f)) // batch upsert
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // update winner flag
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // archive all
                .mockImplementationOnce(f => Promise.resolve({ data: mockVoters, error: null }).then(f)) // winning voters
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // badges

            const result = await calculateWinner();

            expect(result.winner.id).toBe('1');
            expect(result.badgeCount).toBe(3);
        });

        it('should handle "no winner" case when there are no votes', async () => {
            const mockIdeas = [{ id: '1', name: 'Idea 1' }];
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ count: 0, error: null }).then(f)) // per-idea vote count (0 votes)
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f)) // upsert batch
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // archive

            const result = await calculateWinner();
            expect(result.winner).toBeNull();
        });

        it('should throw error if checkBatch fails', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: new Error('DB Error') }).then(f));
            await expect(calculateWinner()).rejects.toThrow('DB Error');
        });

        it('should throw error if winner status update fails', async () => {
            const mockIdeas = [{ id: '1', name: 'Idea 1' }];
            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ count: 1, error: null }).then(f)) // vote count
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'b' }, error: null }).then(f)) // upsert batch
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
                            subject: 'Custom Subject',
                            ideasCount: 1,
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
                    tags: ['weekly-digest']
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
            sendBatchEmails.mockResolvedValueOnce({ success: false, successCount: 0, failCount: 2, error: { message: 'Brevo Down' } });

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
    });
});

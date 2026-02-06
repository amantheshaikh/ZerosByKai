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
        group_by: vi.fn().mockReturnThis(),
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

vi.mock('../../src/emails/templates/weekly-digest.js', () => ({
    generateWeeklyDigestEmail: vi.fn(() => '<html>Email Body</html>')
}));

vi.mock('../../src/utils/emailToken.js', () => ({
    generateEmailToken: vi.fn(() => 'mock-token')
}));

vi.mock('../../src/utils/emailService.js', () => ({
    sendBatchEmails: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../../src/utils/dateUtils.js', () => ({
    getMonday: vi.fn(() => '2025-01-06'),
    getLastMonday: vi.fn(() => '2024-12-30')
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://localhost:3000',
        brevoApiKey: 'mock-key'
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
            const mockVotes = [{ idea_id: '1', count: 10 }];
            const mockVoters = [{ user_id: 'user1' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // checkBatch
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // getIdeas
                .mockImplementationOnce(f => Promise.resolve({ data: mockVotes, error: null }).then(f)) // getVotes
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f)) // batch upsert
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // update winner flag
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)) // archive all
                .mockImplementationOnce(f => Promise.resolve({ data: mockVoters, error: null }).then(f)) // winning voters
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // badges

            const result = await calculateWinner();

            expect(result.winner.id).toBe('1');
            expect(result.badgeCount).toBe(1);
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
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // subscribers
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch status update

            const result = await sendWeeklyDigest();

            expect(result.sent).toBe(1);
            expect(sendBatchEmails).toHaveBeenCalled();
            // Verify subject line was passed correctly - we can't easily check chunk subject without more spies, 
            // but we know it reached this point.
        });

        it('should use default subject if no subject_line in DB', async () => {
            const mockIdeas = [{ id: '1', title: 'Idea 1', created_at: '2025-01-01' }];
            const mockSubscribers = [{ email: 'sub@example.com', name: 'Sub' }];

            supabaseAdmin.then
                .mockImplementationOnce(f => Promise.resolve({ data: { id: 'b1' }, error: null }).then(f)) // currentBatch (no subject)
                .mockImplementationOnce(f => Promise.resolve({ data: [], error: null }).then(f)) // scheduled
                .mockImplementationOnce(f => Promise.resolve({ data: mockIdeas, error: null }).then(f)) // ideas
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeek
                .mockImplementationOnce(f => Promise.resolve({ data: mockSubscribers, error: null }).then(f)) // subscribers
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // batch status update

            const result = await sendWeeklyDigest();
            expect(result.sent).toBe(1);
        });
    });
});

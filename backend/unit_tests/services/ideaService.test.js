import { describe, it, expect, vi, beforeEach } from 'vitest';
let getLatestActiveWeek, getVotingWeek, getLeaderboardForWeek, getIdeasByWeek;
import { supabase, supabaseAdmin } from '../../src/config/supabase.js';

vi.mock('../../src/config/supabase.js', () => import('../mocks/supabase.js'));

vi.mock('../../src/utils/dateUtils.js', () => ({
    getMonday: vi.fn(() => '2025-02-10')
}));

describe('ideaService.js', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        // Reset cache between tests by re-importing the module
        // (The module-level variable _votingWeekCache needs a fresh start)
        const ideaService = await import('../../src/services/ideaService.js');
        getVotingWeek = ideaService.getVotingWeek;
        getLatestActiveWeek = ideaService.getLatestActiveWeek;
        getLeaderboardForWeek = ideaService.getLeaderboardForWeek;
        getIdeasByWeek = ideaService.getIdeasByWeek;

        vi.useFakeTimers();
    });

    describe('getLatestActiveWeek()', () => {
        it('should return the latest week_start_date from DB', async () => {
            supabaseAdmin.single.mockResolvedValueOnce({
                data: { week_start_date: '2025-02-03' },
                error: null
            });

            const result = await getLatestActiveWeek();
            expect(result).toBe('2025-02-03');
            expect(supabaseAdmin.from).toHaveBeenCalledWith('weekly_batches');
        });

        it('should return null if no active week found', async () => {
            supabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null });
            const result = await getLatestActiveWeek();
            expect(result).toBeNull();
        });
    });

    describe('getVotingWeek()', () => {
        it('should fetch from DB and cache the result', async () => {
            supabaseAdmin.single.mockResolvedValueOnce({
                data: { week_published: '2025-02-10' },
                error: null
            });

            // First call - should hit DB
            const result1 = await getVotingWeek();
            expect(result1).toBe('2025-02-10');
            expect(supabaseAdmin.single).toHaveBeenCalledTimes(1);

            // Second call - should hit cache
            const result2 = await getVotingWeek();
            expect(result2).toBe('2025-02-10');
            expect(supabaseAdmin.single).toHaveBeenCalledTimes(1);
        });

        it('should re-fetch after cache expiry (60s)', async () => {
            supabaseAdmin.single.mockResolvedValue({
                data: { week_published: '2025-02-10' },
                error: null
            });

            await getVotingWeek();
            expect(supabaseAdmin.single).toHaveBeenCalledTimes(1);

            // Advance time by 61 seconds
            vi.advanceTimersByTime(61000);

            await getVotingWeek();
            expect(supabaseAdmin.single).toHaveBeenCalledTimes(2);
        });
    });

    describe('getLeaderboardForWeek()', () => {
        it('should return top 3 ideas for the given week', async () => {
            const mockIdeas = [
                { id: 1, name: 'Idea 1', vote_count: 10, tags: ['T1', 'C1'] },
                { id: 2, name: 'Idea 2', vote_count: 5, tags: ['T2', 'C2'] }
            ];
            supabaseAdmin.limit.mockResolvedValueOnce({ data: mockIdeas, error: null });

            const result = await getLeaderboardForWeek('2025-02-03');
            expect(result).toHaveLength(2);
            expect(result[0].votes).toBe(10);
            expect(result[0].category).toBe('C1');
        });

        it('should return empty array if no ideas found', async () => {
            supabaseAdmin.limit.mockResolvedValueOnce({ data: [], error: null });
            const result = await getLeaderboardForWeek('2025-02-03');
            expect(result).toEqual([]);
        });
    });

    describe('getIdeasByWeek()', () => {
        it('should fetch published or winner ideas for the week', async () => {
            const mockIdeas = [{ id: 1, name: 'Idea 1' }];
            supabase.order.mockResolvedValueOnce({ data: mockIdeas, error: null });

            const result = await getIdeasByWeek('2025-02-10');
            expect(result).toEqual(mockIdeas);
            expect(supabase.or).toHaveBeenCalledWith('status.eq.published,is_winner.eq.true');
        });
    });
});

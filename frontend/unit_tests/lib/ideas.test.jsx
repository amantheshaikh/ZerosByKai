import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCurrentWeekIdeas, fetchLeaderboard, fetchArchiveBatches, fetchWeeklyBatch, castVote, getUserVote } from '../../lib/ideas';
import { getApiUrl, apiFetch } from '../../lib/auth';

// Mock Auth lib
vi.mock('../../lib/auth', () => ({
    getApiUrl: vi.fn(() => 'http://localhost:3001'),
    apiFetch: vi.fn(),
}));

// Mock window fetch
global.fetch = vi.fn();

describe('Ideas Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchCurrentWeekIdeas', () => {
        it('fetches and normalizes weekly ideas', async () => {
            const mockData = {
                ideas: [
                    { id: 1, title: 'Idea 1', votes: 10 },
                    { id: 2, title: 'Idea 2', votes: 5 }
                ]
            };
            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const ideas = await fetchCurrentWeekIdeas();

            expect(ideas).toHaveLength(2);
            expect(ideas[0].title).toBe('Idea 1');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/ideas/weekly'),
                expect.any(Object)
            );
        });

        it('returns empty array on error', async () => {
            fetch.mockRejectedValue(new Error('Network Error'));
            const ideas = await fetchCurrentWeekIdeas();
            expect(ideas).toEqual([]);
        });
    });

    describe('fetchLeaderboard', () => {
        it('fetches leaderboard correctly', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 10, title: 'Hall of Fame Idea' }]
            });

            const leaderboard = await fetchLeaderboard();
            expect(leaderboard).toHaveLength(1);
            expect(leaderboard[0].title).toBe('Hall of Fame Idea');
        });
    });

    describe('fetchArchiveBatches', () => {
        it('fetches paginated batches', async () => {
            const mockArchive = {
                batches: [{ date: '2024-01-01', ideas: [], winner: {} }],
                page: 1,
                total: 1
            };
            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockArchive
            });

            const result = await fetchArchiveBatches(1);
            expect(result.batches).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('castVote', () => {
        it('calls apiFetch with correct params', async () => {
            apiFetch.mockResolvedValue({ success: true });
            const session = { access_token: 'valid' };
            
            await castVote('idea-123', session);

            expect(apiFetch).toHaveBeenCalledWith(
                '/api/votes',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('idea-123')
                }),
                session
            );
        });
    });

    describe('getUserVote', () => {
        it('returns idea_id from user vote', async () => {
            apiFetch.mockResolvedValue({ vote: { idea_id: 'voted-id' } });
            
            const voteId = await getUserVote({ access_token: 't' });
            expect(voteId).toBe('voted-id');
        });

        it('returns null if no vote found', async () => {
            apiFetch.mockResolvedValue({ vote: null });
            const voteId = await getUserVote({ access_token: 't' });
            expect(voteId).toBeNull();
        });
    });
});

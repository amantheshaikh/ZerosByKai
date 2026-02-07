import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchCurrentWeekIdeas,
    fetchLeaderboard,
    fetchArchiveBatches,
    castVote,
    getUserVote,
} from '../../lib/ideas';

// Mock auth module
vi.mock('../../lib/auth', () => ({
    getApiUrl: vi.fn(() => 'http://localhost:3001'),
    apiFetch: vi.fn(),
}));

// Mock utils module
vi.mock('../../lib/utils', () => ({
    normalizeIdea: vi.fn((idea) => idea ? { ...idea, normalized: true } : null),
}));

import { getApiUrl, apiFetch } from '../../lib/auth';
import { normalizeIdea } from '../../lib/utils';

describe('Ideas API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchCurrentWeekIdeas', () => {
        it('fetches and normalizes ideas successfully', async () => {
            const mockIdeas = [
                { id: 1, name: 'Idea 1' },
                { id: 2, name: 'Idea 2' },
            ];

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ ideas: mockIdeas }),
            });

            const result = await fetchCurrentWeekIdeas();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/ideas/weekly',
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(result).toHaveLength(2);
            expect(result[0].normalized).toBe(true);
        });

        it('returns empty array on fetch error', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await fetchCurrentWeekIdeas();

            expect(result).toEqual([]);
        });

        it('returns empty array on non-ok response', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            const result = await fetchCurrentWeekIdeas();

            expect(result).toEqual([]);
        });

        it('returns empty array when ideas is missing from response', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            const result = await fetchCurrentWeekIdeas();

            expect(result).toEqual([]);
        });
    });

    describe('fetchLeaderboard', () => {
        it('fetches and normalizes winners successfully', async () => {
            const mockWinners = [
                { id: 1, name: 'Winner 1' },
                { id: 2, name: 'Winner 2' },
            ];

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockWinners,
            });

            const result = await fetchLeaderboard();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/ideas/leaderboard',
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(result).toHaveLength(2);
            expect(result[0].normalized).toBe(true);
        });

        it('returns empty array on error', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await fetchLeaderboard();

            expect(result).toEqual([]);
        });

        it('returns empty array on non-ok response', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
            });

            const result = await fetchLeaderboard();

            expect(result).toEqual([]);
        });
    });

    describe('fetchArchiveBatches', () => {
        it('fetches batches with default pagination', async () => {
            const mockResponse = {
                batches: [
                    {
                        week_of: '2024-01-01',
                        winner: { id: 1, name: 'Winner' },
                        ideas: [{ id: 2, name: 'Idea' }],
                    },
                ],
                page: 1,
                limit: 20,
                total: 1,
                pages: 1,
            };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await fetchArchiveBatches();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/ideas/weekly-batches?page=1&limit=20',
                expect.any(Object)
            );
            expect(result.batches).toHaveLength(1);
            expect(result.batches[0].winner.normalized).toBe(true);
            expect(result.batches[0].ideas[0].normalized).toBe(true);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 1,
                pages: 1,
            });
        });

        it('fetches batches with custom pagination', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    batches: [],
                    page: 2,
                    limit: 10,
                    total: 15,
                    pages: 2,
                }),
            });

            const result = await fetchArchiveBatches(2, 10);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/ideas/weekly-batches?page=2&limit=10',
                expect.any(Object)
            );
            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(10);
        });

        it('returns empty batches on error', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await fetchArchiveBatches();

            expect(result.batches).toEqual([]);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 0,
                pages: 0,
            });
        });

        it('handles missing batches in response', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            const result = await fetchArchiveBatches();

            expect(result.batches).toEqual([]);
        });

        it('handles missing ideas in batch', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    batches: [{ week_of: '2024-01-01', winner: { id: 1 } }],
                }),
            });

            const result = await fetchArchiveBatches();

            expect(result.batches[0].ideas).toEqual([]);
        });
    });

    describe('castVote', () => {
        it('calls apiFetch with correct parameters', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockResolvedValue({ success: true, changedFrom: null });

            const result = await castVote(42, mockSession);

            expect(apiFetch).toHaveBeenCalledWith(
                '/api/votes',
                {
                    method: 'POST',
                    body: JSON.stringify({ ideaId: 42 }),
                },
                mockSession
            );
            expect(result).toEqual({ success: true, changedFrom: null });
        });

        it('throws error on API failure', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockRejectedValue(new Error('Vote failed'));

            await expect(castVote(42, mockSession)).rejects.toThrow('Vote failed');
        });
    });

    describe('getUserVote', () => {
        it('returns idea_id from user vote', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockResolvedValue({ vote: { idea_id: 99 } });

            const result = await getUserVote(mockSession);

            expect(apiFetch).toHaveBeenCalledWith('/api/votes/user', {}, mockSession);
            expect(result).toBe(99);
        });

        it('returns null when no vote exists', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockResolvedValue({ vote: null });

            const result = await getUserVote(mockSession);

            expect(result).toBeNull();
        });

        it('returns null on API error', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockRejectedValue(new Error('API Error'));

            const result = await getUserVote(mockSession);

            expect(result).toBeNull();
        });

        it('returns null when vote object is missing idea_id', async () => {
            const mockSession = { access_token: 'token123' };
            apiFetch.mockResolvedValue({ vote: {} });

            const result = await getUserVote(mockSession);

            expect(result).toBeNull();
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import ideasRouter from '../../src/routes/ideas.js';
import * as ideaService from '../../src/services/ideaService.js';
import { supabase } from '../../src/config/supabase.js';
import { createTestApp } from '../utils/testHelpers.js';

vi.mock('../../src/services/ideaService.js');
vi.mock('../../src/config/supabase.js', () => import('../mocks/supabase.js'));

const app = createTestApp(ideasRouter, '/api/ideas');

describe('ideas.js routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Specific overrides
        ideaService.getLatestActiveWeek.mockResolvedValue('2025-02-03');
    });

    describe('GET /api/ideas/leaderboard', () => {
        it('should return top 3 winners for last week', async () => {
            const mockRanked = [{ id: '1', title: 'Idea 1', votes: 10, category: 'SaaS' }];
            ideaService.getLatestActiveWeek.mockResolvedValue('2025-02-03');
            ideaService.getLeaderboardForWeek.mockResolvedValue(mockRanked);

            const response = await request(app).get('/api/ideas/leaderboard');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockRanked);
        });

        it('should return empty array if no batch found', async () => {
            ideaService.getLatestActiveWeek.mockResolvedValue(null);

            const response = await request(app).get('/api/ideas/leaderboard');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /api/ideas/weekly', () => {
        it('should return latest published batch ideas', async () => {
            const mockIdeas = [{ id: '1', week_published: '2025-02-03' }];
            ideaService.getVotingWeek.mockResolvedValue('2025-02-03');
            ideaService.getIdeasByWeek.mockResolvedValue(mockIdeas);

            const response = await request(app).get('/api/ideas/weekly');

            expect(response.status).toBe(200);
            expect(response.body.weekStart).toBe('2025-02-03');
            expect(response.body.ideas).toEqual(mockIdeas);
        });

        it('should return empty array if no voting week found', async () => {
            ideaService.getVotingWeek.mockResolvedValue(null);
            const response = await request(app).get('/api/ideas/weekly');
            expect(response.status).toBe(200);
            expect(response.body.ideas).toEqual([]);
        });
    });

    describe('GET /api/ideas/weekly-batches', () => {
        it('should return paginated batches with ideas', async () => {
            const mockBatches = [{ week_start_date: '2025-02-03' }];
            const mockIdeas = [{ id: '1', week_published: '2025-02-03' }];

            // This route still has some direct supabase calls for pagination
            supabase.then
                .mockImplementationOnce(f => f({ data: [], error: null, count: 1 }))
                .mockImplementationOnce(f => f({ data: mockBatches, error: null }))
                .mockImplementationOnce(f => f({ data: mockIdeas, error: null }));

            const response = await request(app).get('/api/ideas/weekly-batches');

            expect(response.status).toBe(200);
            expect(response.body.batches).toHaveLength(1);
        });

        it('should return empty array if no batches found', async () => {
            supabase.then
                .mockImplementationOnce(f => f({ count: 0, error: null }))
                .mockImplementationOnce(f => f({ data: [], error: null }));

            const response = await request(app).get('/api/ideas/weekly-batches');
            expect(response.status).toBe(200);
            expect(response.body.batches).toEqual([]);
        });

        it('should handle batch fetch errors', async () => {
            supabase.then.mockImplementationOnce(f => f({ error: { message: 'Fetch Fail' } }));
            const response = await request(app).get('/api/ideas/weekly-batches');
            expect(response.status).toBe(500);
        });
    });

    // Note: GET /api/ideas/:id and GET /api/ideas/winner/:week are currently not implemented in ideas.js
});

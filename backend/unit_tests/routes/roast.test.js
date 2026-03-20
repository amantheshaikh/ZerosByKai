import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import roastRouter from '../../src/routes/roast.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createTestApp } from '../utils/testHelpers.js';

// Mock Dependencies
vi.mock('../../src/config/supabase.js', () => import('../mocks/supabase.js'));

vi.mock('../../src/middleware/authMiddleware.js', () => ({
    requireAuth: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    },
    optionalAuth: (req, res, next) => next()
}));

vi.mock('express-rate-limit', () => ({
    default: () => (req, res, next) => next()
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        gemini: {
            apiKey: 'test-api-key',
            models: {
                primary: 'gemini-2.0-flash-exp',
                fallback: 'gemini-1.5-flash',
                fallbackLite: 'gemini-1.5-pro'
            }
        },
        nodeEnv: 'test'
    }
}));

// Mock Gemini AI
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        constructor() {}
        getGenerativeModel() {
            return {
                generateContent: mockGenerateContent
            };
        }
    }
}));

const app = createTestApp(roastRouter, '/api/roast');

describe('roast.js routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        // Setup default supabase mock behavior
        supabaseAdmin.from.mockReturnThis();
        supabaseAdmin.insert.mockReturnThis();
        supabaseAdmin.select.mockReturnThis();
        supabaseAdmin.eq.mockReturnThis();
        supabaseAdmin.order.mockReturnThis();
        supabaseAdmin.range.mockReturnThis();
        supabaseAdmin.then.mockImplementation((resolve) => {
            resolve({ data: [], error: null, count: 0 });
            return Promise.resolve({ data: [], error: null, count: 0 });
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('POST /api/roast/', () => {
        const validIdea = 'A revolutionary app that reminds you to drink water but only when you are already underwater.';
        
        it('should return 400 if idea is too short', async () => {
            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: 'too short' });
            
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Give Kai something to work with');
        });

        it('should return 400 if idea is too long', async () => {
            const longIdea = 'a'.repeat(2001);
            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: longIdea });
            
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Trim the pitch deck');
        });

        it('should return 200 and roast data on success', async () => {
            const mockRoast = {
                summary: 'A silly water app.',
                verdict: 'Brutal truth.',
                roast_score: 2,
                score_label: 'DUMPSTER FIRE',
                what_went_wrong: ['Everything'],
                who_already_did_it: 'Everyone',
                founder_archetype: 'The dreamer',
                survivability: 'Zero',
                one_real_advice: 'Pivot',
                closing_burn: 'Ouch'
            };

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify(mockRoast)
                }
            });

            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: validIdea, is_public: true });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.roast).toEqual(mockRoast);
            expect(supabaseAdmin.insert).toHaveBeenCalled();
        });

        it('should handle AI parse failures gracefully', async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => 'Not JSON'
                }
            });

            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: validIdea });

            expect(res.status).toBe(500);
            expect(res.body.error).toContain('existential crisis');
        });

        it('should handle AI timeouts', async () => {
            // Mock a timeout by never resolving or rejecting, but we'll use a fast timeout in the test
            // Actually, we can just mock a rejection with the Error('TIMEOUT')
            mockGenerateContent.mockImplementation(() => new Promise((_, reject) => {
                setTimeout(() => reject(new Error('TIMEOUT')), 10);
            }));

            // We need to wait for the timeout in the route which is 45s, 
            // but we can override GEMINI_TIMEOUT_MS if we can, or just wait.
            // Since we can't easily override the constant, we'll try to trigger the catch block.
            
            // Re-mocking to reject immediately
            mockGenerateContent.mockRejectedValue(new Error('TIMEOUT'));

            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: validIdea });

            expect(res.status).toBe(504);
            expect(res.body.error).toContain('fell asleep');
        });

        it('should handle generic AI failures', async () => {
            mockGenerateContent.mockRejectedValue(new Error('AI EXPLODED'));

            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: validIdea });

            expect(res.status).toBe(500);
            expect(res.body.error).toContain('existential crisis');
        });

        it('should return 403 if user has reached their roast limit', async () => {
            // Mock supabase to return count 10
            supabaseAdmin.then.mockImplementationOnce((resolve) => {
                resolve({ count: 10, error: null });
                return Promise.resolve({ count: 10, error: null });
            });

            const res = await request(app)
                .post('/api/roast/')
                .send({ idea: validIdea });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('reached your limit');
        });
    });

    describe('GET /api/roast/public', () => {
        it('should return paginated public roasts', async () => {
            const mockRoasts = [{ id: 1, idea: 'Idea 1', roast_score: 5 }];
            supabaseAdmin.then.mockImplementationOnce(f => 
                Promise.resolve({ data: mockRoasts, count: 1, error: null }).then(f)
            );

            const res = await request(app)
                .get('/api/roast/public')
                .query({ page: 1 });

            expect(res.status).toBe(200);
            expect(res.body.roasts).toEqual(mockRoasts);
            expect(res.body.total).toBe(1);
            expect(res.body.hasMore).toBe(false);
        });

        it('should handle database errors', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => 
                Promise.resolve({ data: null, error: { message: 'DB Error' } }).then(f)
            );

            const res = await request(app).get('/api/roast/public');

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Failed to load the Hall of Shame.');
        });
    });
});

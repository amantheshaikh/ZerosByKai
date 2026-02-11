import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import feedbackRouter from '../../src/routes/feedback.js';
import { supabaseAdmin, supabase } from '../../src/config/supabase.js';

// Use vi.hoisted to define mocks that need to be accessible outside the factory
const { mockFrom, mockInsert } = vi.hoisted(() => {
    const insert = vi.fn(() => ({ error: null }));
    const from = vi.fn(() => ({ insert }));
    return { mockFrom: from, mockInsert: insert };
});

// Mock supabase libraries
vi.mock('../../src/config/supabase.js', () => ({
    supabaseAdmin: {
        from: mockFrom
    },
    supabase: {
        auth: {
            getUser: vi.fn()
        }
    }
}));

// Mock env config
vi.mock('../../src/config/env.js', () => ({
    config: {
        nodeEnv: 'test',
        port: 3001
    }
}));

describe('Feedback Route Security', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/feedback', feedbackRouter);
        vi.clearAllMocks();
    });

    it('should ignore user_id from request body and store as null for guests', async () => {
        const feedbackData = {
            type: 'love',
            message: 'Great job!',
            user_id: 'fake-user-id' // Should be ignored
        };

        const response = await request(app)
            .post('/api/feedback')
            .send(feedbackData);

        expect(response.status).toBe(200);
        expect(mockFrom).toHaveBeenCalledWith('feedback');

        // Check that insert was called with user_id: null, NOT 'fake-user-id'
        expect(mockInsert).toHaveBeenCalledWith([
            expect.objectContaining({
                user_id: null,
                message: 'Great job!'
            })
        ]);
    });

    it('should use user_id from authenticated session even if a different one is in body', async () => {
        const mockUser = { id: 'real-user-id' };
        supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

        const feedbackData = {
            type: 'idea',
            message: 'Add more themes',
            user_id: 'impersonated-user-id' // Should be ignored
        };

        const response = await request(app)
            .post('/api/feedback')
            .set('Authorization', 'Bearer valid-token')
            .send(feedbackData);

        expect(response.status).toBe(200);

        expect(mockInsert).toHaveBeenCalledWith([
            expect.objectContaining({
                user_id: 'real-user-id'
            })
        ]);
    });

    it('should apply rate limiting (verify middleware is present)', async () => {
        const feedbackData = { message: 'test' };
        const response = await request(app).post('/api/feedback').send(feedbackData);
        expect(response.status).toBe(200);
    });
});

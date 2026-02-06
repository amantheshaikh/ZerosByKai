import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import webhooksRouter from '../../src/routes/webhooks.js';
import { supabaseAdmin } from '../../src/config/supabase.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/webhooks', webhooksRouter);

// Mock dependencies
const mockClient = vi.hoisted(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
        admin: {
            deleteUser: vi.fn().mockResolvedValue({ error: null })
        }
    },
    then: vi.fn(function (resolve) {
        return Promise.resolve({ data: null, error: null }).then(resolve);
    })
}));

vi.mock('../../src/config/supabase.js', () => ({
    supabaseAdmin: mockClient
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        brevo: {
            webhookSecret: 'test-secret'
        }
    }
}));

describe('webhooks.js routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/webhooks/brevo', () => {
        it('should return 401 if token is invalid', async () => {
            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'wrong-token' })
                .send({ event: 'unsubscribe', email: 'test@t.com' });

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Unauthorized');
        });

        it('should handle unsubscribed event', async () => {
            mockClient.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unsubscribed', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(mockClient.from).toHaveBeenCalledWith('subscribers');
            expect(mockClient.update).toHaveBeenCalledWith(expect.objectContaining({
                unsubscribed_at: expect.any(String)
            }));
        });

        it('should handle contactDeleted event (with user_id)', async () => {
            // Mock lookup
            mockClient.maybeSingle.mockResolvedValueOnce({ data: { user_id: 'u1' } });
            // Mock delete terminal (thenable)
            mockClient.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'contactDeleted', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(mockClient.auth.admin.deleteUser).toHaveBeenCalledWith('u1');
            expect(mockClient.delete).toHaveBeenCalled();
        });

        it('should handle contactDeleted event (newsletter only)', async () => {
            // Mock lookup - no user_id
            mockClient.maybeSingle.mockResolvedValueOnce({ data: null });
            // Mock delete terminal (thenable)
            mockClient.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'contactDeleted', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(mockClient.auth.admin.deleteUser).not.toHaveBeenCalled();
            expect(mockClient.delete).toHaveBeenCalled();
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unsubscribed' });

            expect(res.status).toBe(400);
        });
    });
});

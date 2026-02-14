import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import webhooksRouter from '../../src/routes/webhooks.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { createTestApp } from '../utils/testHelpers.js';

// Create a test app using the helper
const app = createTestApp(webhooksRouter, '/api/webhooks');

// Mock dependencies centrally
vi.mock('../../src/config/supabase.js', () => import('../mocks/supabase.js'));

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
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unsubscribed', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(supabaseAdmin.from).toHaveBeenCalledWith('subscribers');
            expect(supabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({
                unsubscribed_at: expect.any(String)
            }));
        });

        it('should handle contactDeleted event (with user_id)', async () => {
            // Mock lookup
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: { user_id: 'u1' } });
            // Mock delete terminal (thenable)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'contactDeleted', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('u1');
            expect(supabaseAdmin.delete).toHaveBeenCalled();
        });

        it('should handle contactDeleted event (newsletter only)', async () => {
            // Mock lookup - no user_id
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: null });
            // Mock delete terminal (thenable)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'contactDeleted', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
            expect(supabaseAdmin.delete).toHaveBeenCalled();
        });

        it('should handle bounce/spam/blocked events', async () => {
            const events = ['hard_bounce', 'spam', 'blocked', 'invalid'];

            for (const event of events) {
                supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

                const res = await request(app)
                    .post('/api/webhooks/brevo')
                    .query({ token: 'test-secret' })
                    .send({ event, email: 'test@t.com' });

                expect(res.status).toBe(200);
                expect(supabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({
                    unsubscribe_reason: event
                }));
            }
        });

        it('should handle contact_deleted event (underscore version)', async () => {
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: { user_id: 'u2' } });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'contact_deleted', email: 'delete@t.com' });

            expect(res.status).toBe(200);
            expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('u2');
        });

        it('should return 200 for unknown events (no-op)', async () => {
            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unknown_event', email: 'test@t.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Webhook processed');
        });

        it('should return 500 if Supabase update fails', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: { message: 'DB Error' } }).then(f));

            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unsubscribe', email: 'test@t.com' });

            expect(res.status).toBe(500);
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'unsubscribed' });

            expect(res.status).toBe(400);
        });

        it('should return 401 if no token is provided', async () => {
            const res = await request(app)
                .post('/api/webhooks/brevo')
                .send({ event: 'unsubscribe', email: 'test@t.com' });

            expect(res.status).toBe(401);
        });

        it('should store unsubscribe_reason with the event type', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            await request(app)
                .post('/api/webhooks/brevo')
                .query({ token: 'test-secret' })
                .send({ event: 'hard_bounce', email: 'bounce@t.com' });

            expect(supabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({
                unsubscribed_at: expect.any(String),
                unsubscribe_reason: 'hard_bounce'
            }));
        });
    });
});

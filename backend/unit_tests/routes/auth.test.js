import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/auth.js';
import { supabase, supabaseAdmin } from '../../src/config/supabase.js';
import { sendEmail } from '../../src/utils/emailService.js';
import { syncContact, blocklistContact, deleteContact } from '../../src/services/brevoService.js';
import { verifyEmailToken, generateEmailToken } from '../../src/utils/emailToken.js';
import { config } from '../../src/config/env.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Basic error handler for tests
app.use((err, req, res, next) => {
    res.status(err.status || err.statusCode || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Mock all dependencies
vi.mock('../../src/config/supabase.js', () => {
    const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        auth: {
            getUser: vi.fn(),
            signOut: vi.fn(),
            verifyOtp: vi.fn(),
            admin: {
                generateLink: vi.fn(),
                createSession: vi.fn(),
                deleteUser: vi.fn(),
                listUsers: vi.fn()
            }
        },
        then: vi.fn(function (resolve) {
            return Promise.resolve({ data: null, error: null }).then(resolve);
        })
    };
    return {
        supabase: mockClient,
        supabaseAdmin: mockClient
    };
});

vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://localhost:3000',
        nodeEnv: 'test',
        supabase: {
            serviceKey: 'test-service-key'
        }
    }
}));

vi.mock('../../src/utils/emailService.js', () => ({
    sendEmail: vi.fn(() => Promise.resolve({ success: true, data: { MessageId: 'test-id' } }))
}));

vi.mock('../../src/services/brevoService.js', () => ({
    syncContact: vi.fn(() => Promise.resolve()),
    blocklistContact: vi.fn(() => Promise.resolve()),
    deleteContact: vi.fn(() => Promise.resolve())
}));

vi.mock('../../src/utils/emailToken.js', () => ({
    verifyEmailToken: vi.fn(),
    generateEmailToken: vi.fn(() => 'mock-token')
}));

vi.mock('../../src/emails/templates/welcome.js', () => ({
    generateWelcomeEmail: vi.fn(() => '<html>Welcome</html>')
}));

vi.mock('../../src/emails/templates/magic-link.js', () => ({
    generateMagicLinkEmail: vi.fn(() => '<html>Magic Link</html>')
}));

vi.mock('express-rate-limit', () => ({
    default: () => (req, res, next) => next()
}));

describe('auth.js routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/check', () => {
        it('should return exists:true if subscriber found', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { name: 'John' }, error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/check')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ exists: true, hasName: true, name: 'John' });
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app).post('/api/auth/check').send({});
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/subscribe', () => {
        it('should subscribe and send welcome email', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("You're in!");
            expect(sendEmail).toHaveBeenCalled();
            expect(syncContact).toHaveBeenCalledWith({ email: 'test@example.com', name: 'John' });
        });
    });

    describe('POST /api/auth/signup', () => {
        it('should generate magic link and send email', async () => {
            supabaseAdmin.auth.admin.generateLink.mockResolvedValue({
                data: { properties: { action_link: 'http://link' }, user: { id: 'u1' } },
                error: null
            });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: true, name: 'John' }, error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/signup')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.isExisting).toBe(true);
            expect(sendEmail).toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/post-login', () => {
        it('should send welcome email for new users', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 't@t.com' } }, error: null });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: false, name: 'John' }, error: null }).then(f));
            // Second call for update
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(true);
            expect(sendEmail).toHaveBeenCalled();
        });

        it('should return 404 if subscriber record never appears', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
            supabaseAdmin.then.mockImplementation(f => Promise.resolve({ data: null, error: null }).then(f));

            const sleepSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(404);
            sleepSpy.mockRestore();
        });
    });

    describe('POST /api/auth/verify', () => {
        it('should verify OTP', async () => {
            supabase.auth.verifyOtp.mockResolvedValue({ data: { session: {}, user: {} }, error: null });

            const res = await request(app)
                .post('/api/auth/verify')
                .send({ token: 'hash', type: 'magiclink' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Authenticated successfully');
        });
    });

    describe('POST /api/auth/verify-email-token', () => {
        it('should create session for valid token', async () => {
            verifyEmailToken.mockReturnValue({ userId: 'u1' });
            supabaseAdmin.auth.admin.createSession.mockResolvedValue({ data: { session: {}, user: {} }, error: null });

            const res = await request(app).post('/api/auth/verify-email-token').send({ token: 'valid' });
            expect(res.status).toBe(200);
            expect(res.body.session).toBeDefined();
        });

        it('should return error if userId is invalid', async () => {
            verifyEmailToken.mockImplementationOnce(() => { throw new Error('Invalid Token'); });
            const res = await request(app).post('/api/auth/verify-email-token').send({ token: 'bad' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/unsubscribe', () => {
        it('should unsubscribe user with valid token', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@example.com' });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: [{ email: 'test@example.com' }], error: null }).then(f));

            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@example.com', token: 'valid' });

            expect(res.status).toBe(200);
            expect(blocklistContact).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/auth/user', () => {
        it('should delete user account', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@t.com' } }, error: null });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // delete subscribers
            supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });

            const res = await request(app)
                .delete('/api/auth/user')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(deleteContact).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/auth/admin/user', () => {
        it('should delete user if authorized with service key', async () => {
            supabaseAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [{ id: 'u1', email: 'admin@t.com' }] }, error: null });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // delete subscribers
            supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });

            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-service-key')
                .send({ email: 'admin@t.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted successfully');
        });

        it('should delete from subscribers even if user not in auth', async () => {
            supabaseAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null }); // No users
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // delete subscribers

            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-service-key')
                .send({ email: 'unknown@t.com' });

            expect(res.status).toBe(200);
        });
    });
});

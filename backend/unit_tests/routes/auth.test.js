import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/auth.js';
import { supabase, supabaseAdmin } from '../../src/config/supabase.js';
import { sendEmail } from '../../src/utils/emailService.js';
import { syncContact, blocklistContact, unblockContact, deleteContact } from '../../src/services/brevoService.js';
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
                deleteUser: vi.fn()
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
    unblockContact: vi.fn(() => Promise.resolve()),
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
        it('should subscribe and send welcome email if not already welcomed', async () => {
            // 1. Fetching existing subscriber (none)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f));
            // 2. Upserting subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));
            // 3. Updating welcomed status
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("You're in!");
            expect(sendEmail).toHaveBeenCalled();
            expect(syncContact).toHaveBeenCalledWith({ email: 'test@example.com', name: 'John' });
        });

        it('should subscribe but NOT send welcome email if already welcomed', async () => {
            // 1. Fetching existing subscriber (already welcomed, not unsubscribed)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: true, unsubscribed_at: null }, error: null }).then(f));
            // 2. Upserting subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("You're in!");
            expect(sendEmail).not.toHaveBeenCalled();
            expect(syncContact).not.toHaveBeenCalled();
        });

        it('should re-sync and unblock in Brevo when re-subscribing after unsubscribe', async () => {
            // 1. Fetching existing subscriber (welcomed + previously unsubscribed)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: true, unsubscribed_at: '2025-01-01T00:00:00Z' },
                error: null
            }).then(f));
            // 2. Upserting subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("You're in!");
            expect(sendEmail).not.toHaveBeenCalled(); // No duplicate welcome
            expect(syncContact).toHaveBeenCalledWith({ email: 'test@example.com', name: 'John' });
            expect(unblockContact).toHaveBeenCalledWith('test@example.com');
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
        it('should send welcome email for new users (created < 24h ago)', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 't@t.com' } }, error: null });
            const recentDate = new Date().toISOString();
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: false, name: 'John', created_at: recentDate }, error: null }).then(f));
            // Second call for update
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(true);
            expect(sendEmail).toHaveBeenCalled();
        });

        it('should NOT send welcome email for old users (created > 24h ago)', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 't@t.com' } }, error: null });
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: false, name: 'John', created_at: oldDate }, error: null }).then(f));
            // Update call (even if skip email, we update flag)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(false);
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should clear unsubscribed_at and unblock in Brevo when unsubscribed user logs in', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'unsub@example.com' } },
                error: null
            });
            // Subscriber found: welcomed but unsubscribed
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: true, name: 'John', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: '2025-06-01T00:00:00Z' },
                error: null
            }).then(f));
            // Update to clear unsubscribed_at
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(false);
            expect(supabaseAdmin.update).toHaveBeenCalled();
            expect(unblockContact).toHaveBeenCalledWith('unsub@example.com');
            expect(syncContact).toHaveBeenCalledWith({ email: 'unsub@example.com', name: 'John' });
        });

        it('should create subscriber and treat as new user if record never appears', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'new@example.com', user_metadata: { name: 'New User' } } },
                error: null
            });
            supabaseAdmin.then.mockImplementation(f => Promise.resolve({ data: null, error: null }).then(f));

            const sleepSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(true);
            expect(supabaseAdmin.upsert).toHaveBeenCalled();
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
            verifyEmailToken.mockReturnValue({ userId: 'u1', email: 'test@t.com' });
            supabaseAdmin.auth.admin.generateLink.mockResolvedValue({
                data: { properties: { hashed_token: 'hashed' } },
                error: null
            });
            supabase.auth.verifyOtp.mockResolvedValue({ data: { session: {}, user: {} }, error: null });

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

    describe('POST /api/auth/unsubscribe', () => {
        it('should unsubscribe user with valid token', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@example.com' });
            // First call: check if already unsubscribed (not unsubscribed)
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { unsubscribed_at: null }, error: null }).then(f));
            // Second call: update to unsubscribe
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com', token: 'valid', reason: 'Too many emails' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Unsubscribed successfully');
            expect(blocklistContact).toHaveBeenCalledWith('test@example.com');
        });

        it('should return early if user is already unsubscribed', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@example.com' });
            // User is already unsubscribed
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { unsubscribed_at: '2025-01-01T00:00:00Z' }, error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com', token: 'valid', reason: 'Too many emails' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Already unsubscribed');
            // Should NOT call blocklistContact since already unsubscribed
            expect(blocklistContact).not.toHaveBeenCalled();
        });

        it('should return 401 if token email does not match', async () => {
            verifyEmailToken.mockReturnValue({ email: 'other@example.com' });

            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com', token: 'valid' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid token');
        });

        it('should return 400 if email or token is missing', async () => {
            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com' }); // No token

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Email and token required');
        });
    });

    it('should fail unsubscribe with invalid token format (base64 email)', async () => {
        // Mock verifyEmailToken to throw for invalid format, simulating real behavior
        verifyEmailToken.mockImplementationOnce(() => { throw new Error('Invalid token'); });

        const invalidToken = Buffer.from('test@example.com').toString('base64');
        const res = await request(app)
            .post('/api/auth/unsubscribe')
            .send({
                email: 'test@example.com',
                token: invalidToken
            });

        expect(res.status).toBe(401);
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
            // First call: subscriber lookup returns user_id
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { user_id: 'u1' }, error: null }).then(f));
            // Second call: delete subscribers
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));
            supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });

            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-service-key')
                .send({ email: 'admin@t.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('deleted successfully');
        });

        it('should delete from subscribers even if user not in auth', async () => {
            // Subscriber lookup returns no user_id
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f));
            // Delete subscribers by email
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-service-key')
                .send({ email: 'unknown@t.com' });

            expect(res.status).toBe(200);
        });
    });
});

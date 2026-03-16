import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import authRouter from '../../src/routes/auth.js';
import { supabase, supabaseAdmin } from '../../src/config/supabase.js';
import { sendEmail } from '../../src/utils/emailService.js';
import { syncContact, blocklistContact, unblockContact, deleteContact } from '../../src/services/brevoService.js';
import { verifyEmailToken } from '../../src/utils/emailToken.js';
import { config } from '../../src/config/env.js';
import { createTestApp } from '../utils/testHelpers.js';

// Create a test app using the helper
const app = createTestApp(authRouter, '/api/auth');

// Mock all dependencies centrally
vi.mock('../../src/config/supabase.js', () => import('../mocks/supabase.js'));

vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://localhost:3000',
        nodeEnv: 'test',
        adminApiKey: 'test-admin-key',
        supabase: {
            serviceKey: 'test-service-key'
        }
    }
}));

vi.mock('../../src/utils/emailService.js', () => ({
    sendEmail: vi.fn(() => Promise.resolve({ success: true, data: { MessageId: 'test-id' } }))
}));

vi.mock('../../src/services/brevoService.js', () => ({
    syncContact: vi.fn(() => Promise.resolve(true)),
    blocklistContact: vi.fn(() => Promise.resolve(true)),
    unblockContact: vi.fn(() => Promise.resolve(true)),
    deleteContact: vi.fn(() => Promise.resolve(true))
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
        vi.resetAllMocks();

        const setupMock = (m) => {
            m.from.mockReturnThis();
            m.select.mockReturnThis();
            m.insert.mockReturnThis();
            m.upsert.mockReturnThis();
            m.update.mockReturnThis();
            m.delete.mockReturnThis();
            m.eq.mockReturnThis();
            m.in.mockReturnThis();
            m.not.mockReturnThis();
            m.gt.mockReturnThis();
            m.lte.mockReturnThis();
            m.order.mockReturnThis();
            m.limit.mockReturnThis();
            m.single.mockReturnThis();
            m.maybeSingle.mockReturnThis();
            m.or.mockReturnThis();
            m.range.mockReturnThis();
            m.then.mockImplementation((resolve) => {
                return Promise.resolve({ data: [], error: null }).then(resolve);
            });
        };

        setupMock(supabase);
        setupMock(supabaseAdmin);

        // Default success for shared services
        syncContact.mockResolvedValue(true);
        unblockContact.mockResolvedValue(true);
        sendEmail.mockResolvedValue({ success: true, data: { MessageId: 'test-id' } });
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

        it('should return exists:false if subscriber not found', async () => {
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: { code: 'PGRST116' } }).then(f));

            const res = await request(app)
                .post('/api/auth/check')
                .send({ email: 'nonexistent@example.com' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ exists: false, hasName: false, name: null });
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
            expect(syncContact).toHaveBeenCalledWith({ email: 'test@example.com', name: 'John' });
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

        it('should return 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid email format');
        });

        it('should unblock AND send welcome when re-subscribing unwelcomed+unsubscribed user', async () => {
            // Subscriber exists: never welcomed, was unsubscribed
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: false, unsubscribed_at: '2025-01-01T00:00:00Z', name: 'Old Name' },
                error: null
            }).then(f));
            // Upserting subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));
            // Update welcomed flag
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(sendEmail).toHaveBeenCalled(); // Welcome email sent
            expect(unblockContact).toHaveBeenCalledWith('test@example.com'); // Also unblocked
        });

        it('should not send welcome email if syncContact fails', async () => {
            syncContact.mockResolvedValueOnce(false);
            // No existing subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f));
            // Upsert
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should not mark as welcomed if welcome email fails to send', async () => {
            sendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP Error' });
            // No existing subscriber
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f));
            // Upsert
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com', name: 'John' });

            expect(res.status).toBe(200);
            // update() should NOT have been called to set welcomed: true
            // The upsert was the only DB write, update for welcomed should not fire
            expect(supabaseAdmin.update).not.toHaveBeenCalled();
        });

        it('should preserve existing name when subscribing without a name', async () => {
            // Existing subscriber with name
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: true, unsubscribed_at: null, name: 'Existing Name' },
                error: null
            }).then(f));
            // Upsert
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/subscribe')
                .send({ email: 'test@example.com' }); // No name

            expect(res.status).toBe(200);
            expect(syncContact).toHaveBeenCalledWith({ email: 'test@example.com', name: 'Existing Name' });
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

        it('should send welcome email for any user not yet welcomed, regardless of age', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 't@t.com' } }, error: null });
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { welcomed: false, name: 'John', created_at: oldDate }, error: null }).then(f));
            // Update call for welcomed flag
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(true);
            expect(sendEmail).toHaveBeenCalled();
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

        it('should return isNewUser:false for already welcomed user', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 't@t.com' } },
                error: null
            });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: true, name: 'John', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: null },
                error: null
            }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(false);
            expect(sendEmail).not.toHaveBeenCalled();
            expect(syncContact).not.toHaveBeenCalled();
        });

        it('should sync name change via OAuth and skip welcome for already-welcomed user', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 't@t.com', user_metadata: { name: 'New OAuth Name' } } },
                error: null
            });
            // Subscriber found: welcomed, name differs, not unsubscribed
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: true, name: 'Old Name', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: null },
                error: null
            }).then(f));
            // DB update for name change
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(false);
            expect(syncContact).toHaveBeenCalledWith({ email: 't@t.com', name: 'New OAuth Name' });
            expect(supabaseAdmin.update).toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should unblock Brevo when fallback upsert finds pre-existing unsubscribed subscriber', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'reactivated@t.com', user_metadata: { name: 'User' } } },
                error: null
            });
            // Retry loop: subscriber not found by user_id (5 retries)
            const sleepSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());

            supabaseAdmin.then
                // 5 retry misses (subscriber not found by user_id)
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f))
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f))
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f))
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f))
                .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f))
                // Pre-capture: existing row was unsubscribed
                .mockImplementationOnce(f => Promise.resolve({ data: { unsubscribed_at: '2025-06-01T00:00:00Z' }, error: null }).then(f))
                // Upsert
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f))
                // Read-back actual state (unsubscribed_at now null after upsert)
                .mockImplementationOnce(f => Promise.resolve({
                    data: { welcomed: true, name: 'User', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: null },
                    error: null
                }).then(f))
                // DB update to clear unsubscribed_at (sync block)
                .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(false);
            expect(unblockContact).toHaveBeenCalledWith('reactivated@t.com');
            expect(syncContact).toHaveBeenCalled();
            sleepSpy.mockRestore();
        });

        it('should return emailError when syncContact fails for unwelcomed user', async () => {
            syncContact.mockResolvedValueOnce(false);
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 't@t.com' } },
                error: null
            });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: false, name: 'John', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: null },
                error: null
            }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.emailError).toBe(true);
            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should return emailError when welcome email fails to send', async () => {
            sendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP Error' });
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 't@t.com' } },
                error: null
            });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { welcomed: false, name: 'John', created_at: '2025-01-01T00:00:00Z', unsubscribed_at: null },
                error: null
            }).then(f));

            const res = await request(app)
                .post('/api/auth/post-login')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.isNewUser).toBe(true);
            expect(res.body.emailError).toBe(true);
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
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { user_id: 'u1' }, error: null }).then(f));
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

        it('should throw error if magic link generation fails', async () => {
            verifyEmailToken.mockReturnValue({ userId: 'u1', email: 'test@t.com' });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { user_id: 'u1' }, error: null }).then(f));
            supabaseAdmin.auth.admin.generateLink.mockResolvedValue({ data: null, error: { message: 'Link error' } });
            const res = await request(app).post('/api/auth/verify-email-token').send({ token: 'valid' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/unsubscribe', () => {
        it('should verify unsubscribe token successfully', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@t.com' });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { unsubscribed_at: null }, error: null }).then(f));

            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@t.com', token: 'valid' });

            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
            expect(res.body.isUnsubscribed).toBe(false);
        });

        it('should return 401 for email mismatch', async () => {
            verifyEmailToken.mockReturnValue({ email: 'other@t.com' });
            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@t.com', token: 'valid' });
            expect(res.status).toBe(401);
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ token: 'valid' });
            expect(res.status).toBe(400);
        });

        it('should return 400 if token is missing', async () => {
            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@t.com' });
            expect(res.status).toBe(400);
        });

        it('should return 401 for invalid token', async () => {
            verifyEmailToken.mockImplementationOnce(() => { throw new Error('Invalid token'); });
            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@t.com', token: 'bad' });
            expect(res.status).toBe(401);
        });

        it('should return isUnsubscribed:true if already unsubscribed', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@t.com' });
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({
                data: { unsubscribed_at: '2025-01-01T00:00:00Z' },
                error: null
            }).then(f));

            const res = await request(app)
                .get('/api/auth/unsubscribe')
                .query({ email: 'test@t.com', token: 'valid' });

            expect(res.status).toBe(200);
            expect(res.body.isUnsubscribed).toBe(true);
        });
    });

    describe('GET /api/auth/user', () => {
        it('should return user profile', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
            supabase.then.mockImplementationOnce(f => Promise.resolve({ data: { name: 'John' }, error: null }).then(f));

            const res = await request(app)
                .get('/api/auth/user')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.user.id).toBe('u1');
            expect(res.body.profile.name).toBe('John');
        });
    });

    describe('POST /api/auth/signout', () => {
        it('should sign out successfully', async () => {
            supabase.auth.signOut.mockResolvedValue({ error: null });

            const res = await request(app)
                .post('/api/auth/signout')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Signed out');
        });

        it('should return 401 if no token provided', async () => {
            const res = await request(app).post('/api/auth/signout');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/auth/unsubscribe', () => {
        it('should unsubscribe user with valid token', async () => {
            verifyEmailToken.mockReturnValue({ email: 'test@example.com' });
            // First call to Supabase: check if already unsubscribed (not unsubscribed)
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
            // First call to Supabase: check if already unsubscribed -> returns true
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { unsubscribed_at: '2025-01-01' }, error: null }).then(f));

            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com', token: 'valid', reason: 'Too many emails' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Already unsubscribed');
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

        it('should return 401 for invalid token', async () => {
            verifyEmailToken.mockImplementationOnce(() => { throw new Error('Expired'); });
            const res = await request(app)
                .post('/api/auth/unsubscribe')
                .send({ email: 'test@example.com', token: 'expired-token' });
            expect(res.status).toBe(401);
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
        it('should return 401 if not authorized', async () => {
            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer wrong-key')
                .send({ email: 'test@t.com' });
            expect(res.status).toBe(401);
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-admin-key')
                .send({});
            expect(res.status).toBe(400);
        });

        it('should delete user if authorized with service key', async () => {
            // First call: subscriber lookup returns user_id
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { user_id: 'u1' }, error: null }).then(f));
            // Second call: delete subscribers
            supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ error: null }).then(f));
            supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });

            const res = await request(app)
                .delete('/api/auth/admin/user')
                .set('Authorization', 'Bearer test-admin-key')
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
                .set('Authorization', 'Bearer test-admin-key')
                .send({ email: 'unknown@t.com' });

            expect(res.status).toBe(200);
        });
    });
});

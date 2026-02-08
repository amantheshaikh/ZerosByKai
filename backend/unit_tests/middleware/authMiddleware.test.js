import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from '../../src/middleware/authMiddleware.js';
import { supabase } from '../../src/config/supabase.js';

// Mock supabase
vi.mock('../../src/config/supabase.js', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        }
    }
}));

describe('authMiddleware.js', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            headers: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        next = vi.fn();
    });

    describe('requireAuth', () => {
        it('should return 401 if no authorization header is provided', async () => {
            await requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid or user not found', async () => {
            req.headers.authorization = 'Bearer invalid-token';
            supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Invalid token') });

            await requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token or session expired' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next and attach user to req if token is valid', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            req.headers.authorization = 'Bearer valid-token';
            supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

            await requireAuth(req, res, next);
            expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if an unexpected error occurs during authentication', async () => {
            req.headers.authorization = 'Bearer token';
            supabase.auth.getUser.mockRejectedValueOnce(new Error('Internal breakdown'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
            expect(next).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});

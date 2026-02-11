import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmailToken, verifyEmailToken } from '../../src/utils/emailToken.js';
import jwt from 'jsonwebtoken';

vi.mock('../../src/config/env.js', () => ({
    config: {
        emailTokenSecret: 'test-secret'
    }
}));

describe('emailToken.js', () => {
    const userId = 'user-123';
    const email = 'test@example.com';

    it('should generate a valid JWT token', () => {
        const token = generateEmailToken(userId, email);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = jwt.decode(token);
        expect(decoded.userId).toBe(userId);
        expect(decoded.email).toBe(email);
        expect(decoded.purpose).toBe('email-auth');
    });

    it('should verify a valid token', () => {
        const token = generateEmailToken(userId, email);
        const result = verifyEmailToken(token);
        expect(result.userId).toBe(userId);
        expect(result.email).toBe(email);
    });

    it('should throw "Invalid token" for tampered tokens', () => {
        const token = generateEmailToken(userId, email);
        const tamperedToken = token + 'manipulated';
        expect(() => verifyEmailToken(tamperedToken)).toThrow('Invalid token');
    });

    it('should throw "Token has expired" for expired tokens', () => {
        // Create an expired token manually
        const expiredToken = jwt.sign(
            { userId, email, purpose: 'email-auth', iat: Math.floor(Date.now() / 1000) - 10000 },
            'test-secret',
            { expiresIn: '0s' }
        );
        expect(() => verifyEmailToken(expiredToken)).toThrow('Token has expired');
    });

    it('should throw "Invalid token purpose" for tokens with wrong purpose', () => {
        const wrongPurposeToken = jwt.sign(
            { userId, email, purpose: 'wrong-purpose' },
            'test-secret'
        );
        expect(() => verifyEmailToken(wrongPurposeToken)).toThrow('Invalid token purpose');
    });
});

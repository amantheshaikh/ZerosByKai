import jwt from 'jsonwebtoken';

import { config } from '../config/env.js';

const SECRET = config.emailTokenSecret;
if (!SECRET) {
    throw new Error('EMAIL_TOKEN_SECRET is not set');
}

const EXPIRATION = '7d'; // 7 days - matches weekly email cadence

/**
 * Generate a one-time authentication token for email links
 * @param {string} userId - Supabase user ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
export function generateEmailToken(userId, email) {
    return jwt.sign(
        {
            userId,
            email,
            purpose: 'email-auth',
            iat: Math.floor(Date.now() / 1000)
        },
        SECRET,
        { expiresIn: EXPIRATION }
    );
}

/**
 * Verify and decode an email authentication token
 * @param {string} token - JWT token from email link
 * @returns {object} Decoded token payload { userId, email, purpose }
 * @throws {Error} If token is invalid or expired
 */
export function verifyEmailToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET);

        // Validate token purpose
        if (decoded.purpose !== 'email-auth') {
            throw new Error('Invalid token purpose');
        }

        return {
            userId: decoded.userId,
            email: decoded.email
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
}

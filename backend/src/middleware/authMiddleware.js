import { supabase } from '../config/supabase.js';

/**
 * Middleware to verify JWT token from Supabase
 * Attaches the user object to req.user if valid
 */
export const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token or session expired' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to optionally verify JWT token from Supabase
 * Attaches the user object to req.user if valid, but doesn't block if missing/invalid
 */
export const optionalAuth = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return next();
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
            req.user = user;
        }
        next();
    } catch (error) {
        // Silent fail for optional auth
        next();
    }
};

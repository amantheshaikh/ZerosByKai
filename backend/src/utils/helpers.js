/**
 * Shared utility helpers for ZerosByKai
 */

/**
 * Helper to wait for a specific amount of time
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Human-like delay with variation
 */
export const humanDelay = (baseMs = 2000) => {
    const variation = Math.random() * baseMs;
    return wait(baseMs + variation);
};

/**
 * Helper to mask email for PII-safe logging
 */
export const maskEmail = (email) => {
    if (!email) return 'unknown';
    const [local, domain] = email.split('@');
    if (!domain) return email.substring(0, 3) + '...';

    // Stricter masking for short local parts to prevent PII leakage
    if (local.length === 0) {
        return `***@${domain}`;
    }
    if (local.length <= 2) {
        return `${local[0]}${local.length > 1 ? '*' : ''}*@${domain}`;
    }

    return `${local.substring(0, 2)}...${local.slice(-1)}@${domain}`;
};

/**
 * Centralized Admin Configuration
 * Loaded from environment variables for security.
 */
export const ADMIN_CONFIG = {
    email: process.env.ADMIN_EMAIL,
    name: process.env.ADMIN_NAME || 'Admin',
    backlogThreshold: (() => {
        const parsed = parseInt(process.env.BACKLOG_THRESHOLD || '10', 10);
        return Number.isNaN(parsed) ? 10 : parsed;
    })()
};

// Fail-fast check for critical configuration
if (!ADMIN_CONFIG.email) {
    console.error('❌ FATAL ERROR: ADMIN_EMAIL environment variable is missing.');
    // In production, we want to know immediately if the env is misconfigured
    if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_EMAIL is required but not configured');
    }
}

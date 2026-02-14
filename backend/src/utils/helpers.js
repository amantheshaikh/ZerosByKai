/**
 * Shared utility helpers for ZerosByKai
 */

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
 * Helper to wait for a specified number of milliseconds
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

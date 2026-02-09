import { describe, it, expect, vi } from 'vitest';
import { generateWelcomeEmail } from '../../src/emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../../src/emails/templates/magic-link.js';
import { escapeHtml } from '../../src/emails/templates/shared.js';

// Mock config
vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://test-frontend.com',
        nodeEnv: 'test'
    }
}));

describe('Email Templates', () => {
    describe('Shared Utilities', () => {
        it('escapeHtml should escape special characters', () => {
            const unsafe = '<script>alert("xss")</script>';
            const safe = escapeHtml(unsafe);
            expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('escapeHtml should return empty string for null/undefined', () => {
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });
    });

    describe('Welcome Email', () => {
        it('should generate email with valid mirror link and unsubscribe link', () => {
            const email = 'test@example.com';
            const token = 'secure-token-123';
            const html = generateWelcomeEmail({ name: 'John', email, token });

            // Check Mirror Link (should assume Frontend URL)
            expect(html).toContain('http://test-frontend.com/view/welcome');

            // Check Unsubscribe Link
            expect(html).toContain(`http://test-frontend.com/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`);
        });

        it('should escape user name to prevent XSS', () => {
            const maliciousName = '<script>alert(1)</script>';
            const html = generateWelcomeEmail({ name: maliciousName, email: 'test@example.com', token: 'token' });

            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        });

        it('should use default greeting if name is missing', () => {
            const html = generateWelcomeEmail({ email: 'test@example.com', token: 'token' });
            expect(html).toContain('Welcome, there.');
        });
    });

    describe('Magic Link Email', () => {
        it('should generate email with valid mirror link', () => {
            const html = generateMagicLinkEmail({
                email: 'test@example.com',
                actionLink: 'http://magic-link',
                name: 'John'
            });

            expect(html).toContain('http://test-frontend.com/view/magic-link');
            expect(html).toContain('http://magic-link');
        });

        it('should escape user name', () => {
            const maliciousName = '<b>Bold</b>';
            const html = generateMagicLinkEmail({
                email: 'test@example.com',
                actionLink: 'http://magic-link',
                name: maliciousName
            });

            expect(html).not.toContain('<b>Bold</b>');
            expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
        });
    });
});

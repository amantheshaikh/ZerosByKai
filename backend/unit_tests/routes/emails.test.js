import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import emailsRouter from '../../src/routes/emails.js';

import { createTestApp } from '../utils/testHelpers.js';

// Mock dependencies
vi.mock('../../src/emails/templates/welcome.js', () => ({
    generateWelcomeEmail: vi.fn(() => '<html>Welcome</html>')
}));

vi.mock('../../src/emails/templates/magic-link.js', () => ({
    generateMagicLinkEmail: vi.fn(() => '<html>Magic Link</html>')
}));

// Create app using helper
const app = createTestApp(emailsRouter, '/api/emails');

describe('emails.js routes', () => {
    describe('GET /api/emails/view/:type', () => {
        it('should return welcome email html', async () => {
            const res = await request(app).get('/api/emails/view/welcome');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('text/html');
            expect(res.text).toBe('<html>Welcome</html>');
        });

        it('should return magic-link email html', async () => {
            const res = await request(app).get('/api/emails/view/magic-link');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('text/html');
            expect(res.text).toBe('<html>Magic Link</html>');
        });

        it('should return 400 for invalid type', async () => {
            const res = await request(app).get('/api/emails/view/invalid-type');
            expect(res.status).toBe(400);
            expect(res.text).toBe('Invalid email type.');
        });
    });
});

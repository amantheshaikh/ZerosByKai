import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Global Configuration / Source of Truth for Environment Variables
 */
export const config = {
    // Infrastructure
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database (Supabase)
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },

    // Email (Brevo)
    brevo: {
        apiKey: process.env.BREVO_API_KEY,
        listId: parseInt(process.env.BREVO_LIST_ID || '2', 10),
    },

    // AI (Gemini)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        models: {
            primary: 'gemini-2.0-flash',
            fallback: 'gemini-flash-latest',
            fallbackBackup: 'gemini-pro-latest',
        },
    },

    // Auth & Security
    jwtSecret: process.env.JWT_SECRET,
    emailTokenSecret: process.env.EMAIL_TOKEN_SECRET,

    // Admin Config
    admin: {
        email: process.env.ADMIN_EMAIL,
        name: process.env.ADMIN_NAME || 'Admin',
        backlogThreshold: parseInt(process.env.BACKLOG_THRESHOLD || '10', 10),
    },

    // External APIs
    reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
    },
    apify: {
        token: process.env.APIFY_API_TOKEN,
    },
};

// Simple validation
const requiredEnv = [
    { key: 'SUPABASE_URL', val: config.supabase.url },
    { key: 'SUPABASE_SERVICE_KEY', val: config.supabase.serviceKey },
    { key: 'GEMINI_API_KEY', val: config.gemini.apiKey },
    { key: 'BREVO_API_KEY', val: config.brevo.apiKey },
    { key: 'JWT_SECRET', val: config.jwtSecret },
    { key: 'EMAIL_TOKEN_SECRET', val: config.emailTokenSecret }
];

const missing = requiredEnv.filter(e => !e.val).map(e => e.key);
if (missing.length > 0) {
    const msg = `❌ Missing required environment variables: ${missing.join(', ')}`;
    // Always log the missing variables for developer awareness
    console.error(msg);
    // Fail fast in production to avoid running with insecure defaults
    if (process.env.NODE_ENV === 'production') {
        throw new Error(msg);
    }
}

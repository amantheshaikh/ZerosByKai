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
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database (Supabase)
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },

    // Email (AWS SES)
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
    },

    // AI (Gemini)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        models: {
            primary: 'gemini-3-flash-preview',
            fallback: 'gemini-3-pro-preview',
        },
    },

    // Auth & Security
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    emailTokenSecret: process.env.EMAIL_TOKEN_SECRET || process.env.JWT_SECRET,

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
};

// Simple validation
if (!config.supabase.url || !config.supabase.serviceKey) {
    console.error('❌ Missing critical Supabase configuration');
}
if (!config.gemini.apiKey) {
    console.error('❌ Missing GEMINI_API_KEY');
}

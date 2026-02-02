import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const { url, anonKey, serviceKey } = config.supabase;

if (!url || !anonKey) {
  console.warn('⚠️  Supabase credentials missing. DB features will be disabled.');
} else if (!serviceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_KEY missing. Admin features (like newsletter subscribe) will be disabled.');
}

// Client for regular operations (respects RLS)
export const supabase = (url && anonKey)
  ? createClient(url, anonKey)
  : null;

// Admin client (bypasses RLS)
export const supabaseAdmin = (url && serviceKey)
  ? createClient(url, serviceKey)
  : null;

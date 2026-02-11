import express from 'express';
import { config } from '../config/env.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateWelcomeEmail } from '../emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../emails/templates/magic-link.js';
import { sendEmail } from '../utils/emailService.js';
import rateLimit from 'express-rate-limit';
import { generateEmailToken } from '../utils/emailToken.js';
import { syncContact, blocklistContact, deleteContact } from '../services/brevoService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { verifyEmailToken } from '../utils/emailToken.js';

const router = express.Router();

// Rate limiters for public endpoints (Relaxed in non-production)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 15 : 100,
  message: { error: 'Too many authentication requests, please try again later.' }
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many token verification attempts. Please request a new link.' }
});

// Helper for admin key check
const requireAdminKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${config.supabase.serviceKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }
  next();
};

// POST /api/auth/check - Check if user exists and has name
router.post('/check', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    const { data: subscriber, error } = await supabaseAdmin
      .from('subscribers')
      .select('name, welcomed')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      exists: !!subscriber,
      hasName: !!subscriber?.name,
      name: subscriber?.name || null
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/subscribe - Newsletter-only subscribe
router.post('/subscribe', authLimiter, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Subscription service unavailable' });
    }

    const { error } = await supabaseAdmin
      .from('subscribers')
      .upsert(
        { email, name: name || null, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
        { onConflict: 'email' }
      );

    if (error) throw error;

    // Async tasks
    syncContact({ email, name }).catch(err => console.error('Brevo Sync Error:', err.message));

    const token = generateEmailToken(email, email);
    const welcomeHtml = generateWelcomeEmail({ name: name || null, email, token });
    sendEmail({
      to: email,
      subject: "Welcome to ZerosByKai",
      html: welcomeHtml,
      tags: ['welcome-email'],
      headers: {
        'List-Unsubscribe': `<${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    }).catch(err => console.error('Welcome Email Error:', err.message));

    res.json({ message: "You're in!" });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/signup - Send magic link
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_KEY missing');

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${config.frontendUrl}/auth/callback`,
        data: { name: name || '' }
      }
    });

    if (error) throw error;

    // Get existing info if any
    const { data: subscriber } = await supabaseAdmin
      .from('subscribers')
      .select('welcomed, name')
      .eq('email', email)
      .maybeSingle();

    const magicLinkHtml = generateMagicLinkEmail({
      email,
      actionLink: data.properties.action_link,
      name: name || subscriber?.name || ''
    });

    const { success, error: emailError } = await sendEmail({
      to: email,
      subject: "Your Login Link",
      html: magicLinkHtml,
      tags: ['magic-link']
    });

    if (!success) throw new Error(emailError || 'Failed to send email');

    res.json({
      message: 'Magic link sent! Check your email.',
      email,
      isExisting: subscriber?.welcomed === true
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/post-login
router.post('/post-login', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;

    // Retry logic for subscriber record (created by DB trigger)
    let subscriber = null;
    let retries = 5;
    while (retries > 0) {
      const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select('welcomed, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        subscriber = data;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }

    if (!subscriber) return res.status(404).json({ error: 'Subscriber record not found' });
    if (subscriber.welcomed) return res.json({ isNewUser: false });

    // New user tasks
    const userName = subscriber.name || user.user_metadata?.name || null;
    syncContact({ email: user.email, name: userName }).catch(err => console.error('Brevo Sync Error:', err.message));

    const token = generateEmailToken(user.id, user.email);
    const welcomeHtml = generateWelcomeEmail({ name: userName, email: user.email, token });

    const { success } = await sendEmail({
      to: user.email,
      subject: "Welcome to ZerosByKai",
      html: welcomeHtml,
      tags: ['welcome-email'],
      headers: {
        'List-Unsubscribe': `<${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(user.email)}&token=${token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    });

    if (success) {
      await supabaseAdmin.from('subscribers').update({ welcomed: true }).eq('user_id', user.id);
    }

    res.json({ isNewUser: true, emailError: !success });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify - Verify magic link token
router.post('/verify', async (req, res, next) => {
  try {
    const { token, type } = req.body;
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type || 'magiclink'
    });

    if (error) throw error;
    res.json({
      message: 'Authenticated successfully',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/verify-email-token
router.post('/verify-email-token', tokenLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const { userId } = verifyEmailToken(token);
    const { data, error } = await supabaseAdmin.auth.admin.createSession({ user_id: userId });

    if (error) throw error;
    res.json({ session: data.session, user: data.user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// GET /api/auth/user
router.get('/user', requireAuth, async (req, res, next) => {
  try {
    const { data: profile } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    res.json({ user: req.user, profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/signout
router.post('/signout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    const { error } = await supabase.auth.signOut(token);
    if (error) throw error;

    res.json({ message: 'Signed out' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/unsubscribe - Verify token validity ONLY
router.get('/unsubscribe', tokenLimiter, async (req, res, next) => {
  try {
    const { email, token } = req.query;

    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!token) return res.status(400).json({ error: 'Token required' });

    let decoded;
    try {
      decoded = verifyEmailToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.email !== email) {
      console.warn(`Unsubscribe token mismatch for email: ${email}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if already unsubscribed
    const { data: subscriber, error } = await supabaseAdmin
      .from('subscribers')
      .select('unsubscribed_at')
      .eq('email', email)
      .maybeSingle();

    if (error) console.error('Supabase error checking subscription status:', error);

    res.json({
      valid: true,
      email,
      isUnsubscribed: !!subscriber?.unsubscribed_at
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/unsubscribe - Perform unsubscription with reason
router.post('/unsubscribe', tokenLimiter, async (req, res, next) => {
  try {
    const { email, token, reason } = req.body;

    if (!email || !token) return res.status(400).json({ error: 'Email and token required' });

    // Verify again for security
    let decoded;
    try {
      decoded = verifyEmailToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.email !== email) return res.status(401).json({ error: 'Invalid token' });

    // Check if already unsubscribed to avoid redundant DB updates
    const { data: existing } = await supabaseAdmin
      .from('subscribers')
      .select('unsubscribed_at')
      .eq('email', email)
      .maybeSingle();

    if (existing?.unsubscribed_at) {
      return res.json({ message: 'Already unsubscribed' });
    }

    // Update Supabase
    const { error } = await supabaseAdmin.from('subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason || null
      })
      .eq('email', email);

    if (error) throw error;

    // Log the reason internally nicely
    console.log(`User ${email} unsubscribed. Reason: ${reason || 'No reason provided'}`);

    // Sync with Brevo
    blocklistContact(email).catch(err => console.error('Brevo Blocklist Error:', err.message));

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    next(error);
  }
});

// DELETE /api/auth/user - Delete current user
router.delete('/user', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    deleteContact(user.email).catch(err => console.error('Brevo Delete Error:', err.message));

    await supabaseAdmin.from('subscribers').delete().eq('user_id', user.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    res.json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/admin/user - Admin delete
router.delete('/admin/user', requireAdminKey, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await deleteContact(email).catch(() => { });

    const { data: subscriber } = await supabaseAdmin
      .from('subscribers')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (subscriber?.user_id) {
      await supabaseAdmin.from('subscribers').delete().eq('user_id', subscriber.user_id);
      await supabaseAdmin.auth.admin.deleteUser(subscriber.user_id);
    } else {
      await supabaseAdmin.from('subscribers').delete().eq('email', email);
    }

    res.json({ message: `User ${email} deleted successfully from all systems` });
  } catch (error) {
    next(error);
  }
});
export default router;

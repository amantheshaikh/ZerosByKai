import express from 'express';
import { config } from '../config/env.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateWelcomeEmail } from '../emails/templates/welcome.js';
import { generateMagicLinkEmail } from '../emails/templates/magic-link.js';
import { verifyEmailToken } from '../utils/emailToken.js';
import { sendEmail } from '../utils/emailService.js';
import rateLimit from 'express-rate-limit';
import { generateEmailToken } from '../utils/emailToken.js';
import { syncContact, blocklistContact, deleteContact } from '../services/brevoService.js';

const router = express.Router();

// Rate limiters for public endpoints (Relaxed in non-production)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 15 : 100, // 15 requests per 15 minutes in prod, 100 in dev
  message: { error: 'Too many authentication requests, please try again later.' }
});

// Stricter limiter for one-time tokens (brute-force protection)
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 5 : 20, // fewer attempts allowed
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many token verification attempts. Please request a new link.' }
});

// POST /api/auth/check - Check if user exists and has name
router.post('/check', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!supabaseAdmin) {
      console.error('❌ Check failed: SUPABASE_SERVICE_KEY missing');
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    // Check subscribers table
    const { data: subscriber, error } = await supabaseAdmin
      .from('subscribers')
      .select('name, welcomed')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      throw error;
    }

    // If no subscriber found, check auth.users (fallback for legacy cases)
    // Note: This requires admin privileges which supabaseAdmin has
    let name = subscriber?.name || null;

    // Return status
    res.json({
      exists: !!subscriber,
      hasName: !!name,
      name: name
    });

  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/subscribe - Newsletter-only subscribe (no account creation)
router.post('/subscribe', authLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!supabaseAdmin) {
      console.error('❌ Subscribe failed: SUPABASE_SERVICE_KEY missing in environment variables');
      return res.status(503).json({ error: 'Subscription service temporarily unavailable. Please contact support.' });
    }

    // Upsert into subscribers table (re-subscribe if previously unsubscribed)
    // Use supabaseAdmin to bypass RLS since this is a public endpoint doing an update
    const { error } = await supabaseAdmin
      .from('subscribers')
      .upsert(
        { email, name: name || null, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
        { onConflict: 'email' }
      );

    if (error) throw error;

    // Send welcome email (fire-and-forget)
    try {
      // 1. Sync Contact to Brevo
      syncContact({ email, name }).catch(err => {
        console.error(`❌ Failed to sync contact for ${email}:`, err.message);
      });

      // 2. Send Email
      const token = generateEmailToken(email, email);
      const welcomeHtml = generateWelcomeEmail({ name: name || null, email });

      const { success, error: emailError, data } = await sendEmail({
        to: email,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
        tags: ['welcome-email'],
        headers: {
          'List-Unsubscribe': `<${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });
      if (!success) console.error('❌ Failed to send welcome email:', emailError);
      else console.log('✅ Welcome email sent:', data.MessageId);
    } catch (emailError) {
      console.error('❌ Unexpected error sending welcome email:', emailError);
    }

    res.json({ message: "You're in!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signup - Send magic link
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!supabaseAdmin) {
      console.error('❌ Signup failed: SUPABASE_SERVICE_KEY missing');
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    // Generate link using Admin API to get the action_link directly
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${config.frontendUrl}/auth/callback`,
        data: {
          name: name || ''
        }
      }
    });

    if (error) throw error;

    // Check if this is an existing user and get name
    let isExisting = false;
    let dbName = null;

    if (data?.properties?.action_link && data.user?.id) {
      const { data: subscriber } = await supabaseAdmin
        .from('subscribers')
        .select('welcomed, name')
        .eq('user_id', data.user.id)
        .single();

      isExisting = subscriber?.welcomed === true;
      dbName = subscriber?.name;
    }

    // Send email
    try {
      const magicLinkHtml = generateMagicLinkEmail({
        email,
        actionLink: data.properties.action_link,
        name: name || dbName || '' // Prefer input name, fall back to DB, then empty
      });

      const { success, error: emailError, data: emailData } = await sendEmail({
        to: email,
        subject: "Your Login Link",
        html: magicLinkHtml,
        tags: ['magic-link']
      });

      if (!success) {
        console.error('❌ Failed to send magic link email:', emailError);
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
      console.log('✅ Magic link sent:', emailData.MessageId);
    } catch (emailError) {
      console.error('❌ Unexpected error sending magic link email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      message: 'Magic link sent! Check your email.',
      email,
      isExisting
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/post-login - Handle post-login tasks (welcome email, subscriber sync)
router.post('/post-login', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has already been welcomed
    // Use retry logic to wait for the subscriber record to be created by the Supabase trigger
    let subscriber = null;
    let retries = 5;
    while (retries > 0) {
      const { data, error: subError } = await supabaseAdmin
        .from('subscribers')
        .select('welcomed, name')
        .eq('user_id', user.id)
        .single();

      if (!subError && data) {
        subscriber = data;
        break;
      }

      console.log(`Waiting for subscriber record... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }

    if (!subscriber) {
      console.error(`❌ Post-login: Subscriber record not found for user ${user.id} after retries`);
      return res.status(404).json({ error: 'Subscriber record not found' });
    }

    if (subscriber.welcomed) {
      return res.json({ isNewUser: false });
    }

    // New user: send welcome email
    const userName = subscriber.name || user.user_metadata?.name || null;
    const userEmail = user.email;

    try {
      // Sync confirmed user to Brevo
      syncContact({ email: userEmail, name: userName }).catch(err => {
        console.error(`❌ Failed to sync contact for ${userEmail}:`, err.message);
      });

      const token = generateEmailToken(user.id, userEmail);
      const welcomeHtml = generateWelcomeEmail({ name: userName, email: userEmail });
      const { success, error: emailError, data } = await sendEmail({
        to: userEmail,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
        tags: ['welcome-email'],
        headers: {
          'List-Unsubscribe': `<${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&token=${token}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });

      if (!success) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't mark as welcomed so we can try again on next login
        return res.json({ isNewUser: true, emailError: true });
      }

      // Mark user as welcomed ONLY after successful email send
      await supabaseAdmin
        .from('subscribers')
        .update({ welcomed: true })
        .eq('user_id', user.id);

      console.log(`✅ Welcome email sent and status updated for ${userEmail}. ID: ${data.MessageId}`);
      res.json({ isNewUser: true });

    } catch (emailError) {
      console.error('❌ Unexpected error sending welcome email:', emailError);
      res.json({ isNewUser: true, emailError: true });
    }

  } catch (error) {
    console.error('Post-login error:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/auth/verify - Verify magic link token
router.post('/verify', async (req, res) => {
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

// POST /api/auth/verify-email-token - Verify email link token and create session
router.post('/verify-email-token', tokenLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Basic token format validation to reject obviously invalid attempts early
    if (typeof token !== 'string' || token.length < 20 || token.length > 2000) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    // Verify and decode the email token
    const { userId, email } = verifyEmailToken(token);

    // Create a session for this user using Supabase Admin
    const { data, error } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId
    });

    if (error) {
      console.error('Failed to create session:', error);
      throw error;
    }

    res.json({
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Email token verification error:', error.message);
    res.status(401).json({ error: error.message });
  }
});


// GET /api/auth/user - Get current user
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get subscriber record (replaces profiles)
    const { data: profile } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signout
router.post('/signout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { error } = await supabase.auth.signOut(token);

    if (error) throw error;

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/unsubscribe - Unsubscribe email
router.get('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Secure token verification
    try {
      const decoded = verifyEmailToken(token);
      if (decoded.email !== email) {
        return res.status(401).json({ error: 'Invalid unsubscribe token for this email' });
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired unsubscribe token' });
    }

    // Mark as unsubscribed in subscribers table (acts as suppression list)
    // 1. Try to update existing subscriber (preserves name/other data)
    const { data: existing, error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email)
      .select();

    if (updateError) throw updateError;

    // 2. If no subscriber found (e.g. auth user not in list), insert new suppression record
    if (!existing || existing.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('subscribers')
        .insert({
          email,
          unsubscribed_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    }

    // 3. Blocklist in Brevo (fire-and-forget)
    blocklistContact(email).catch(err => {
      console.error(`❌ Failed to blocklist contact for ${email} in Brevo:`, err.message);
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/auth/user - Delete current user account and sync with Brevo
router.delete('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userEmail = user.email;

    // 1. Delete from Brevo (fire-and-forget)
    deleteContact(userEmail).catch(err => {
      console.error(`❌ Failed to delete contact for ${userEmail} from Brevo:`, err.message);
    });

    // 2. Delete from subscribers table (preserves RLS if any, but we use admin to be sure)
    await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id);

    // 3. Delete from auth.users (requires Admin API)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    console.log(`🗑️ User deleted: ${userEmail}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/auth/admin/user - Admin delete user (requires service key)
router.delete('/admin/user', async (req, res) => {
  try {
    const { email } = req.body;
    const authHeader = req.headers.authorization;

    // Strict admin check: require Supabase Service Key in header
    if (authHeader !== `Bearer ${config.supabase.serviceKey}`) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 1. Delete from Brevo
    await deleteContact(email);

    // 2. Get user by email to delete from Supabase
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find(u => u.email === email);
    if (user) {
      // Delete from subscribers
      await supabaseAdmin.from('subscribers').delete().eq('user_id', user.id);
      // Delete from auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    } else {
      // Just in case they are only in subscribers
      await supabaseAdmin.from('subscribers').delete().eq('email', email);
    }

    console.log(`🗑️ Admin deleted user: ${email}`);
    res.json({ message: `User ${email} deleted successfully from all systems` });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

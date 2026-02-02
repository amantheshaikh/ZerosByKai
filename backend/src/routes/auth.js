import express from 'express';
import { config } from '../config/env.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateWelcomeEmail, generateMagicLinkEmail } from '../emails/templates.js';
import { verifyEmailToken } from '../utils/emailToken.js';
import { sendEmail } from '../utils/emailService.js';
import rateLimit from 'express-rate-limit';
import { generateEmailToken } from '../utils/emailToken.js';

const router = express.Router();

// Rate limiters for public endpoints (Relaxed in non-production)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 15 : 100, // 15 requests per 15 minutes in prod, 100 in dev
  message: { error: 'Too many authentication requests, please try again later.' }
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

    // Send welcome email (fire-and-forget, don't block the response)
    try {
      const token = generateEmailToken(email, email); // Secure token for unsubscribe
      const welcomeHtml = generateWelcomeEmail({ name: name || null, email });
      const { success, error: emailError, data } = await sendEmail({
        to: email,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
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

    // Check if this is an existing user (for frontend messaging)
    let isExisting = false;
    if (data?.properties?.action_link && data.user?.id) {
      const { data: subscriber } = await supabaseAdmin
        .from('subscribers')
        .select('welcomed')
        .eq('user_id', data.user.id)
        .single();

      isExisting = subscriber?.welcomed === true;
    }

    // Send email using SES
    try {
      const magicLinkHtml = generateMagicLinkEmail({
        email,
        actionLink: data.properties.action_link
      });

      const { success, error: emailError, data: emailData } = await sendEmail({
        to: email,
        subject: "Your Login Link",
        html: magicLinkHtml
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
      const token = generateEmailToken(user.id, userEmail);
      const welcomeHtml = generateWelcomeEmail({ name: userName, email: userEmail });
      const { success, error: emailError, data } = await sendEmail({
        to: userEmail,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
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
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
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

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

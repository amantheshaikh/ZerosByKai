import express from 'express';
import { Resend } from 'resend';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateWelcomeEmail, generateMagicLinkEmail } from '../emails/templates.js';
import { verifyEmailToken } from '../utils/emailToken.js';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/auth/check - Check if user exists and has name
router.post('/check', async (req, res) => {
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
router.post('/subscribe', async (req, res) => {
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
      const welcomeHtml = generateWelcomeEmail({ name: name || null, email });
      await resend.emails.send({
        from: 'Kai <kai@zerosbykai.com>',
        reply_to: 'kai@zerosbykai.com',
        to: email,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
        headers: {
          'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${Buffer.from(email).toString('base64')}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({ message: "You're in!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signup - Send magic link
router.post('/signup', async (req, res) => {
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
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
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

    // Send email using Resend
    try {
      const magicLinkHtml = generateMagicLinkEmail({
        email,
        actionLink: data.properties.action_link
      });

      await resend.emails.send({
        from: 'Kai <kai@zerosbykai.com>',
        reply_to: 'kai@zerosbykai.com',
        to: email,
        subject: "Your Login Link",
        html: magicLinkHtml
      });
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError);
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

    // Check if user has already been welcomed (subscriber record created by trigger)
    const { data: subscriber, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('welcomed, name')
      .eq('user_id', user.id)
      .single();

    if (subError) throw subError;

    if (subscriber?.welcomed) {
      return res.json({ isNewUser: false });
    }

    // New user: send welcome email (fire-and-forget)
    const userName = subscriber?.name || user.user_metadata?.name || null;
    const userEmail = user.email;

    try {
      const welcomeHtml = generateWelcomeEmail({ name: userName, email: userEmail });
      await resend.emails.send({
        from: 'Kai <kai@zerosbykai.com>',
        reply_to: 'kai@zerosbykai.com',
        to: userEmail,
        subject: "Welcome to ZerosByKai",
        html: welcomeHtml,
        headers: {
          'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(userEmail)}&token=${Buffer.from(userEmail).toString('base64')}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Mark user as welcomed
    await supabaseAdmin
      .from('subscribers')
      .update({ welcomed: true })
      .eq('user_id', user.id);

    res.json({ isNewUser: true });
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

    // Validate token (simple base64 check for MVP)
    const validToken = Buffer.from(email).toString('base64');
    if (!token || token !== validToken) {
      return res.status(401).json({ error: 'Invalid unsubscribe token' });
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

import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// POST /api/auth/signup - Send magic link
router.post('/signup', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Send magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        data: {
          name: name || ''
        }
      }
    });

    if (error) throw error;

    res.json({ 
      message: 'Magic link sent! Check your email.',
      email 
    });
  } catch (error) {
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

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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

export default router;

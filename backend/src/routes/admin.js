import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Simple password auth middleware
const requireAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// GET /api/admin/pending - List pending ideas
router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const { data: ideas, error } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ ideas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/approve/:id - Approve idea
router.post('/approve/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: idea, error } = await supabaseAdmin
      .from('ideas')
      .update({ 
        status: 'approved',
        moderated_at: new Date().toISOString(),
        moderated_by: 'admin'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Idea approved', idea });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/reject/:id - Reject idea
router.post('/reject/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: idea, error } = await supabaseAdmin
      .from('ideas')
      .update({ 
        status: 'rejected',
        moderated_at: new Date().toISOString(),
        moderated_by: 'admin',
        moderation_notes: reason || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Idea rejected', idea });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/publish - Publish all approved ideas
router.post('/publish', requireAdmin, async (req, res) => {
  try {
    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    const { data: ideas, error } = await supabaseAdmin
      .from('ideas')
      .update({ status: 'published' })
      .eq('status', 'approved')
      .eq('week_published', weekStart)
      .select();

    if (error) throw error;

    res.json({ 
      message: `${ideas.length} ideas published`,
      ideas 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/idea/:id - Edit idea
router.put('/idea/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow updating certain fields
    const allowedFields = ['name', 'title', 'problem', 'solution', 'target_audience', 'why_it_matters', 'tags'];
    const sanitized = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitized[field] = updates[field];
      }
    }

    const { data: idea, error } = await supabaseAdmin
      .from('ideas')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Idea updated', idea });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

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

// DELETE /api/admin/idea/:id - Delete a pending idea
router.delete('/idea/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: idea, error } = await supabaseAdmin
      .from('ideas')
      .delete()
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Idea deleted', idea });
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

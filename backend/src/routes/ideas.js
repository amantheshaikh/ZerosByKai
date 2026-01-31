import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/ideas - List all published ideas
router.get('/', async (req, res) => {
  try {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('status', 'published')
      .order('week_published', { ascending: false });

    if (error) throw error;

    res.json({ ideas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/weekly - Get current week's ideas
router.get('/weekly', async (req, res) => {
  try {
    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('status', 'published')
      .eq('week_published', weekStart)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ ideas, weekStart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/weekly-batches - Get all past weekly batches with winners
router.get('/weekly-batches', async (req, res) => {
  try {
    const { data: batches, error } = await supabase
      .from('weekly_batches')
      .select(`
        *,
        winner:winner_idea_id (*)
      `)
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    res.json({ batches: batches || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/:id - Get single idea with vote count
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (ideaError) throw ideaError;

    // Get vote count
    const { count, error: voteError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('idea_id', id);

    if (voteError) throw voteError;

    res.json({ 
      ...idea, 
      voteCount: count || 0 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/winner/:week - Get winner for specific week
router.get('/winner/:week', async (req, res) => {
  try {
    const { week } = req.params;

    const { data: batch, error } = await supabase
      .from('weekly_batches')
      .select(`
        *,
        winner:winner_idea_id (*)
      `)
      .eq('week_start_date', week)
      .single();

    if (error) throw error;

    res.json({ batch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

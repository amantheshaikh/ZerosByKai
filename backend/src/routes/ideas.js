import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /api/ideas/leaderboard - Get top 3 winners from last week
router.get('/leaderboard', async (req, res) => {
  try {
    // 1. Calculate Last Week's Monday
    const today = new Date();
    // Move back 7 days to get into "last week" timeframe, then find that week's Monday
    const lastWeekDate = new Date(today);
    lastWeekDate.setDate(today.getDate() - 7);

    // Find Monday of that date
    // JS getDay(): Sun=0, Mon=1...
    // To get Monday:
    const day = lastWeekDate.getDay();
    const diff = lastWeekDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(lastWeekDate.setDate(diff));
    const weekStart = monday.toISOString().split('T')[0];

    console.log(`Fetching leaderboard for week: ${weekStart}`);

    // 2. Fetch ideas for that week with vote counts
    const { data: ideas, error } = await supabaseAdmin
      .from('ideas')
      .select('*, votes(count)') // Select votes count
      .eq('week_published', weekStart)
      .eq('status', 'published');

    if (error) throw error;

    // 3. Sort by vote count (desc) and take top 3
    // Note: Supabase .select('*, votes(count)') returns votes as [{count: N}, ...] or array of objects unless using count function differently.
    // Easier way: Get ideas, then iterate or use a view.
    // Or: Fetch votes separately and aggregate.
    // Given the small dataset (10 ideas), fetching votes for all of them is fine.

    const ideasWithVotes = await Promise.all(ideas.map(async (idea) => {
      const { count } = await supabaseAdmin
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', idea.id);
      return { ...idea, votes: count || 0 };
    }));

    const sorted = ideasWithVotes.sort((a, b) => b.votes - a.votes).slice(0, 3);

    // Add category/rank
    // Just map to needed format
    const ranked = sorted.map((idea, index) => ({
      ...idea,
      category: idea.tags?.category || 'Startup',
      // Ensure minimal fields for frontend
    }));

    res.json(ranked);

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    // precise diff: if sunday (0), go back 6 days. else go back day-1
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
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

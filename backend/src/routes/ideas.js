import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { getLastMonday } from '../utils/dateUtils.js';

const router = express.Router();

// GET /api/ideas/leaderboard - Get top 3 winners from last week
router.get('/leaderboard', async (req, res) => {
  try {
    // 1. Find the latest week that has published ideas
    const { data: latestIdea } = await supabaseAdmin
      .from('ideas')
      .select('week_published')
      .or('status.eq.published,is_winner.eq.true')
      .not('week_published', 'is', null)
      .gt('week_published', '2025-01-01')
      .order('week_published', { ascending: false })
      .limit(1)
      .single();

    if (!latestIdea) return res.json([]);

    // 2. The leaderboard should show the week BEFORE the current one
    const currentWeek = new Date(latestIdea.week_published);
    const lastWeekDate = new Date(currentWeek);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const weekStart = lastWeekDate.toISOString().split('T')[0];

    console.log(`Fetching leaderboard for batch preceding ${latestIdea.week_published}: ${weekStart}`);

    // 2. Fetch ideas for that week with vote counts
    const { data: ideas, error } = await supabaseAdmin
      .from('ideas')
      .select('*, votes(count)') // Select votes count
      .eq('week_published', weekStart)
      .or('status.eq.published,is_winner.eq.true');

    if (error) throw error;

    // 3. Sort by vote count (desc) and take top 3
    const ideasWithVotes = await Promise.all(ideas.map(async (idea) => {
      const { count } = await supabaseAdmin
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', idea.id);
      return { ...idea, votes: count || 0 };
    }));

    const sorted = ideasWithVotes.sort((a, b) => b.votes - a.votes).slice(0, 3);

    // Add category/rank
    const ranked = sorted.map((idea, index) => ({
      ...idea,
      category: idea.tags?.category || 'Startup',
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
      .or('status.eq.published,is_winner.eq.true')
      .order('week_published', { ascending: false });

    if (error) throw error;

    res.json({ ideas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/weekly - Get latest published batch of ideas
router.get('/weekly', async (req, res) => {
  try {
    // 1. Find the latest week that has published ideas
    const { data: latestIdea, error: weekError } = await supabase
      .from('ideas')
      .select('week_published')
      .or('status.eq.published,is_winner.eq.true')
      .order('week_published', { ascending: false })
      .limit(1)
      .single();

    if (weekError && weekError.code !== 'PGRST116') throw weekError;

    if (!latestIdea) {
      return res.json({ ideas: [], weekStart: null });
    }

    const weekStart = latestIdea.week_published;

    // 2. Fetch all published ideas for that week
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .or('status.eq.published,is_winner.eq.true')
      .eq('week_published', weekStart)
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    res.json({ ideas, weekStart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ideas/weekly-batches - Get all past weekly batches with winners and all ideas
router.get('/weekly-batches', async (req, res) => {
  try {
    const { data: batches, error } = await supabase
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (*)
      `)
      .not('week_start_date', 'is', null)
      .gt('week_start_date', '2025-01-01')
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    if (!batches || batches.length === 0) {
      return res.json({ batches: [] });
    }

    // Optimized: Avoid N+1 query by fetching all ideas for these weeks in one go
    const weekStartDates = batches.map(b => b.week_start_date);
    const { data: allIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .in('week_published', weekStartDates)
      .or('status.eq.published,is_winner.eq.true')
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    // Map ideas back to their respective batches
    const batchesWithIdeas = batches.map(batch => ({
      ...batch,
      ideas: allIdeas?.filter(idea => idea.week_published === batch.week_start_date) || []
    }));

    res.json({ batches: batchesWithIdeas });
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
      .or('status.eq.published,is_winner.eq.true')
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
        winner:ideas!fk_weekly_batches_winner_idea (*)
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

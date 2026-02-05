import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';

const router = express.Router();

// GET /api/ideas/leaderboard - Get top 3 winners from last week
router.get('/leaderboard', async (req, res) => {
  try {
    // 1. Find the latest batch that has been "sent" or is current (Data-Driven)
    const { data: latestBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select('week_start_date')
      .not('week_start_date', 'is', null)
      .gt('week_start_date', '2025-01-01')
      .lte('week_start_date', getMonday()) // Can be this week
      .order('week_start_date', { ascending: false })
      .limit(1)
      .single();

    if (!latestBatch) return res.json([]);

    // 2. The leaderboard should show the week BEFORE the latest one
    // (If Feb 2 is the latest active week, show Jan 26 results)
    const latestDate = new Date(latestBatch.week_start_date);
    const lastWeekDate = new Date(latestDate);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const weekStart = lastWeekDate.toISOString().split('T')[0];

    console.log(`Fetching leaderboard results for week: ${weekStart}`);

    // 2. Fetch ideas for that week
    const { data: ideas, error } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('week_published', weekStart)
      .in('status', ['published', 'archived']);

    if (error) throw error;

    // If no ideas, return empty
    if (!ideas || ideas.length === 0) return res.json([]);

    // 3. Fetch all votes for these ideas in a single query to avoid N+1
    const ideaIds = ideas.map(i => i.id);
    const { data: votesRows, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('idea_id')
      .in('idea_id', ideaIds);

    if (votesError) throw votesError;

    const voteCountMap = {};
    (votesRows || []).forEach(v => {
      voteCountMap[v.idea_id] = (voteCountMap[v.idea_id] || 0) + 1;
    });

    const ideasWithVotes = ideas.map(idea => ({
      ...idea,
      votes: voteCountMap[idea.id] || 0
    }));

    const sorted = ideasWithVotes.sort((a, b) => b.votes - a.votes).slice(0, 3);

    // Add category/rank
    const ranked = sorted.map((idea, index) => {
      let category = 'Startup';
      if (idea.tags) {
        if (Array.isArray(idea.tags)) {
          // New format: ["Tag1", "Tag2"] -> Tag2 is usually the category
          category = idea.tags[1] || idea.tags[0] || 'Startup';
        } else {
          // Legacy format: { category: "Tag" }
          category = idea.tags.category || 'Startup';
        }
      }
      return { ...idea, category };
    });

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
      .lte('week_published', getMonday())
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
      .lte('week_published', getMonday())
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

// GET /api/ideas/weekly-batches - Get past weekly batches with pagination
// Query params: page (default: 1), limit (default: 20)
router.get('/weekly-batches', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20)); // Max 100 per page

    // First, get total count
    const { count, error: countError } = await supabase
      .from('weekly_batches')
      .select('*', { count: 'exact', head: true })
      .not('week_start_date', 'is', null)
      .not('email_sent_at', 'is', null)
      .gt('week_start_date', '2025-01-01');

    if (countError) throw countError;

    const total = count || 0;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch paginated batches
    const { data: batches, error } = await supabase
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (*)
      `)
      .not('week_start_date', 'is', null)
      .not('email_sent_at', 'is', null)
      .gt('week_start_date', '2025-01-01')
      .order('week_start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (!batches || batches.length === 0) {
      return res.json({
        batches: [],
        page,
        limit,
        total,
        pages
      });
    }

    // Optimized: Avoid N+1 query by fetching all ideas for these weeks in one go
    const weekStartDates = batches.map(b => b.week_start_date);
    const { data: allIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .in('week_published', weekStartDates)
      // No status filter here, if it belongs to a past batch, we show it
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    // Map ideas back to their respective batches
    const batchesWithIdeas = batches.map(batch => ({
      ...batch,
      ideas: allIdeas?.filter(opp => opp.week_published === batch.week_start_date) || []
    }));

    res.json({
      batches: batchesWithIdeas,
      page,
      limit,
      total,
      pages
    });
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

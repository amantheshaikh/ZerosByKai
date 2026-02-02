import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { getLastMonday } from '../utils/dateUtils.js';

const router = express.Router();

// Middleware to verify JWT token from Supabase
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Helper: Get the current active week for voting
const getActiveWeek = async () => {
  const { data: latestIdea } = await supabaseAdmin
    .from('ideas')
    .select('week_published')
    .eq('status', 'published')
    .order('week_published', { ascending: false })
    .limit(1)
    .single();

  return latestIdea?.week_published || null;
};

// GET /api/votes - Get votes status (public)
router.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Use POST to cast votes or GET /user for your current vote.' });
});

// POST /api/votes - Cast or change vote (one vote per week)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { ideaId } = req.body;
    const userId = req.user.id;

    const weekStart = await getActiveWeek();

    // Check if idea exists and is from current week
    const { data: idea, error: ideaError } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('week_published', weekStart)
      .eq('status', 'published')
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({ error: 'Idea not found or not from current week' });
    }

    // Check if user already voted this week
    const { data: existingVotes, error: voteCheckError } = await supabaseAdmin
      .from('votes')
      .select('id, idea_id')
      .eq('user_id', userId)
      .in('idea_id',
        await supabaseAdmin
          .from('ideas')
          .select('id')
          .eq('week_published', weekStart)
          .then(({ data }) => data?.map(i => i.id) || [])
      );

    if (voteCheckError) throw voteCheckError;

    // If user already voted, delete previous vote
    if (existingVotes && existingVotes.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('votes')
        .delete()
        .in('id', existingVotes.map(v => v.id));

      if (deleteError) throw deleteError;
    }

    // Insert new vote
    const { data: vote, error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        idea_id: ideaId,
        user_id: userId
      })
      .select()
      .single();

    if (voteError) throw voteError;

    res.json({
      message: 'Vote cast successfully',
      vote,
      changedFrom: existingVotes && existingVotes.length > 0 ? existingVotes[0].idea_id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/votes/user - Get user's current vote
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const weekStart = await getActiveWeek();

    // Get current week's ideas
    const { data: weekIdeas } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', weekStart)
      .eq('status', 'published');

    if (!weekIdeas || weekIdeas.length === 0) {
      return res.json({ vote: null });
    }

    const ideaIds = weekIdeas.map(i => i.id);

    // Get user's vote from this week
    const { data: vote, error } = await supabaseAdmin
      .from('votes')
      .select('*, idea:ideas(*)')
      .eq('user_id', userId)
      .in('idea_id', ideaIds)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    res.json({ vote: vote || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/votes/last-week - Get user's last week vote result
router.get('/last-week', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find the latest week that has published ideas (Data-Driven)
    const activeWeek = await getActiveWeek();
    if (!activeWeek) {
      return res.json({ lastWeekVote: null, winner: null, earnedBadge: false });
    }

    // 2. Last week is exactly 7 days before the active one
    const activeDate = new Date(activeWeek);
    const lastWeekDate = new Date(activeDate);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const lastWeekStart = lastWeekDate.toISOString().split('T')[0];

    console.log(`[DEBUG] /last-week: userId=${userId}, activeWeek=${activeWeek}, lastWeekStart=${lastWeekStart}`);

    // 1. Get last week's batch with winner
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (id, name, title)
      `)
      .eq('week_start_date', lastWeekStart)
      .maybeSingle();

    if (batchError) {
      console.error(`[DEBUG] Error fetching batch for ${lastWeekStart}:`, batchError);
    }

    if (!batch || !batch.winner) {
      console.log(`[DEBUG] No winner data found for ${lastWeekStart}. Batch: ${!!batch}, Winner: ${!!batch?.winner}`);
      return res.json({
        lastWeekVote: null,
        winner: null,
        earnedBadge: false,
        debug: { lastWeekStart, userId, hasBatch: !!batch }
      });
    }

    // 2. Count votes for winner
    const { count: winnerVoteCount } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('idea_id', batch.winner_idea_id);

    // 3. Get user's vote from last week
    // We need to find if the user voted for ANY idea that was active last week
    const { data: lastWeekIdeas } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', lastWeekStart);

    const lastWeekIdeaIds = lastWeekIdeas?.map(i => i.id) || [];

    let lastWeekVote = null;
    if (lastWeekIdeaIds.length > 0) {
      const { data: vote } = await supabaseAdmin
        .from('votes')
        .select('*, idea:ideas(id, name, title)')
        .eq('user_id', userId)
        .in('idea_id', lastWeekIdeaIds)
        .maybeSingle();

      lastWeekVote = vote || null;
    }

    // 4. Check if user earned a badge for the winning idea
    const { data: badge } = await supabaseAdmin
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('idea_id', batch.winner_idea_id)
      .maybeSingle();

    res.json({
      lastWeekVote: lastWeekVote ? { name: lastWeekVote.idea?.name, title: lastWeekVote.idea?.title } : null,
      winner: {
        name: batch.winner.name,
        title: batch.winner.title,
        voteCount: winnerVoteCount || 0
      },
      earnedBadge: !!badge,
      debug: { lastWeekStart, userId }
    });

  } catch (error) {
    console.error('[DEBUG] /last-week error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/votes/badges - Get user's badges
router.get('/badges', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: badges, error } = await supabaseAdmin
      .from('user_badges')
      .select('*, idea:ideas(*)')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;

    const kaiPickCount = badges?.filter(b => b.badge_type === 'kai_pick').length || 0;
    let tier = 'onlooker';
    if (kaiPickCount >= 20) tier = 'unicorn_hunter';
    else if (kaiPickCount >= 12) tier = 'head_intelligence';
    else if (kaiPickCount >= 7) tier = 'lead_analyst';
    else if (kaiPickCount >= 3) tier = 'field_agent';

    res.json({
      badges,
      count: kaiPickCount,
      tier
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

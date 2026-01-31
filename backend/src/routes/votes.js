import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

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

// POST /api/votes - Cast or change vote (one vote per week)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { ideaId } = req.body;
    const userId = req.user.id;

    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay(); // Sun=0, Mon=1...
    // If Sunday (0), we need to go back 6 days. If Monday (1) to Sat (6), go back day-1.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    const weekStart = monday.toISOString().split('T')[0];

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

    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    const weekStart = monday.toISOString().split('T')[0];

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

    // Get last week's Monday
    const today = new Date();
    const lastMonday = new Date(today);
    const day = today.getDay();

    // Correct logic for LAST week's Monday:
    const currentMondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
    lastMonday.setDate(currentMondayDiff - 7);

    const lastWeekStart = lastMonday.toISOString().split('T')[0];

    // Get last week's batch with winner
    const { data: batch } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:winner_idea_id (id, name, title)
      `)
      .eq('week_start_date', lastWeekStart)
      .single();

    if (!batch || !batch.winner) {
      return res.json({ lastWeekVote: null, winner: null, earnedBadge: false });
    }

    // Count votes for winner
    const { count: winnerVoteCount } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('idea_id', batch.winner.id);

    // Get last week's ideas
    const { data: lastWeekIdeas } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', lastWeekStart)
      .eq('status', 'published');

    const lastWeekIdeaIds = lastWeekIdeas?.map(i => i.id) || [];

    // Get user's vote from last week
    let lastWeekVote = null;
    if (lastWeekIdeaIds.length > 0) {
      const { data: vote } = await supabaseAdmin
        .from('votes')
        .select('*, idea:ideas(id, name, title)')
        .eq('user_id', userId)
        .in('idea_id', lastWeekIdeaIds)
        .single();

      lastWeekVote = vote || null;
    }

    // Check if user earned a badge for the winning idea
    let earnedBadge = false;
    if (batch.winner) {
      const { data: badge } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('idea_id', batch.winner.id)
        .single();

      earnedBadge = !!badge;
    }

    res.json({
      lastWeekVote: lastWeekVote ? { name: lastWeekVote.idea?.name, title: lastWeekVote.idea?.title } : null,
      winner: { name: batch.winner.name, title: batch.winner.title, voteCount: winnerVoteCount || 0 },
      earnedBadge
    });
  } catch (error) {
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

    // Calculate tier
    const kaiPickCount = badges?.filter(b => b.badge_type === 'kai_pick').length || 0;
    let tier = 'none';
    if (kaiPickCount >= 11) tier = 'diamond';
    else if (kaiPickCount >= 6) tier = 'gold';
    else if (kaiPickCount >= 3) tier = 'silver';
    else if (kaiPickCount >= 1) tier = 'bronze';

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

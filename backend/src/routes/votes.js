import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as ideaService from '../services/ideaService.js';
import * as badgeService from '../services/badgeService.js';

const router = express.Router();

// POST /api/votes - Cast or change vote (one vote per week)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { ideaId } = req.body;
    const userId = req.user.id;

    const weekStart = await ideaService.getVotingWeek();

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

    // Get this week's idea IDs, then check if user already voted
    const { data: weekIdeas } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', weekStart);

    const weekIdeaIds = weekIdeas?.map(i => i.id) || [];

    const { data: existingVotes, error: voteCheckError } = await supabaseAdmin
      .from('votes')
      .select('id, idea_id')
      .eq('user_id', userId)
      .in('idea_id', weekIdeaIds);

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
    next(error);
  }
});

// GET /api/votes/user - Get user's current vote
router.get('/user', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const weekStart = await ideaService.getVotingWeek();

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
      .maybeSingle();

    if (error) throw error;

    res.json({ vote: vote || null });
  } catch (error) {
    next(error);
  }
});

// GET /api/votes/last-week - Get user's last week vote result
router.get('/last-week', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Find the latest week that has published ideas
    const activeWeek = await ideaService.getVotingWeek();
    if (!activeWeek) {
      return res.json({ lastWeekVote: null, winner: null, earnedBadge: false });
    }

    // 2. Last week is exactly 7 days before the active one
    const activeDate = new Date(activeWeek);
    const lastWeekDate = new Date(activeDate);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const lastWeekStart = lastWeekDate.toISOString().split('T')[0];

    // 1. Get last week's batch with winner
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (id, name, title)
      `)
      .eq('week_start_date', lastWeekStart)
      .maybeSingle();

    if (batchError) throw batchError;

    if (!batch || !batch.winner) {
      return res.json({
        lastWeekVote: null,
        winner: null,
        earnedBadge: false
      });
    }

    // 2. Fetch winner vote count, user's vote, and badge check in parallel
    const { data: lastWeekIdeas } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', lastWeekStart);

    const lastWeekIdeaIds = lastWeekIdeas?.map(i => i.id) || [];

    const [
      { count: winnerVoteCount },
      lastWeekVote,
      earnedBadge
    ] = await Promise.all([
      supabaseAdmin
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', batch.winner_idea_id),
      lastWeekIdeaIds.length > 0
        ? supabaseAdmin
            .from('votes')
            .select('*, idea:ideas(id, name, title)')
            .eq('user_id', userId)
            .in('idea_id', lastWeekIdeaIds)
            .maybeSingle()
            .then(({ data }) => data || null)
        : Promise.resolve(null),
      badgeService.hasBadge(userId, batch.winner_idea_id)
    ]);

    res.json({
      lastWeekVote: lastWeekVote ? { name: lastWeekVote.idea?.name, title: lastWeekVote.idea?.title } : null,
      winner: {
        name: batch.winner.name,
        title: batch.winner.title,
        voteCount: winnerVoteCount || 0
      },
      earnedBadge
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/votes/badges - Get user's badges
router.get('/badges', requireAuth, async (req, res, next) => {
  try {
    const result = await badgeService.getUserBadges(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
export default router;

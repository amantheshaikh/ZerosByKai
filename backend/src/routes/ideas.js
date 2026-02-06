import express from 'express';
import { supabase } from '../config/supabase.js';
import { getMonday } from '../utils/dateUtils.js';
import * as ideaService from '../services/ideaService.js';

const router = express.Router();

// GET /api/ideas/leaderboard - Get top 3 winners from last week
router.get('/leaderboard', async (req, res, next) => {
  try {
    const latestActiveWeek = await ideaService.getLatestActiveWeek();
    if (!latestActiveWeek) return res.json([]);

    // The leaderboard shows the week BEFORE the latest one
    const latestDate = new Date(latestActiveWeek);
    const lastWeekDate = new Date(latestDate);
    lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
    const weekStart = lastWeekDate.toISOString().split('T')[0];

    const ranked = await ideaService.getLeaderboardForWeek(weekStart);
    res.json(ranked);
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas - List all published ideas
router.get('/', async (req, res, next) => {
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
    next(error);
  }
});

// GET /api/ideas/weekly - Get latest published batch of ideas
router.get('/weekly', async (req, res, next) => {
  try {
    const weekStart = await ideaService.getVotingWeek();
    if (!weekStart) {
      return res.json({ ideas: [], weekStart: null });
    }

    const ideas = await ideaService.getIdeasByWeek(weekStart);
    res.json({ ideas, weekStart });
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas/weekly-batches - Get past weekly batches with pagination
router.get('/weekly-batches', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));

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
      return res.json({ batches: [], page, limit, total, pages });
    }

    // Optimized: Fetch all ideas for these weeks in one go
    const weekStartDates = batches.map(b => b.week_start_date);
    const allIdeas = await ideaService.getIdeasByWeek(weekStartDates);
    // Wait, getIdeasByWeek needs to handle array or I use a different query

    const { data: batchIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .in('week_published', weekStartDates)
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    const batchesWithIdeas = batches.map(batch => ({
      ...batch,
      ideas: batchIdeas?.filter(opp => opp.week_published === batch.week_start_date) || []
    }));

    res.json({
      batches: batchesWithIdeas,
      page,
      limit,
      total,
      pages
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas/:id - Get single idea with vote count
router.get('/:id', async (req, res, next) => {
  try {
    const idea = await ideaService.getIdeaWithVoteCount(req.params.id);
    res.json(idea);
  } catch (error) {
    next(error);
  }
});

// GET /api/ideas/winner/:week - Get winner for specific week
router.get('/winner/:week', async (req, res, next) => {
  try {
    const batch = await ideaService.getWinnerByWeek(req.params.week);
    res.json({ batch });
  } catch (error) {
    next(error);
  }
});
export default router;

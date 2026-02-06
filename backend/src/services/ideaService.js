import { supabase, supabaseAdmin } from '../config/supabase.js';
import { getMonday } from '../utils/dateUtils.js';

/**
 * Get the latest week that has published ideas or is current
 */
export const getLatestActiveWeek = async () => {
    const { data } = await supabaseAdmin
        .from('weekly_batches')
        .select('week_start_date')
        .not('week_start_date', 'is', null)
        .gt('week_start_date', '2025-01-01')
        .lte('week_start_date', getMonday())
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

    return data?.week_start_date || null;
};

/**
 * Get the current active week specifically for voting (published ideas)
 */
export const getVotingWeek = async () => {
    const { data: latestIdea } = await supabaseAdmin
        .from('ideas')
        .select('week_published')
        .eq('status', 'published')
        .order('week_published', { ascending: false })
        .limit(1)
        .single();

    return latestIdea?.week_published || null;
};

/**
 * Calculate leaderboard for a specific week
 * @param {string} weekStart 
 */
export const getLeaderboardForWeek = async (weekStart) => {
    // Fetch ideas for that week
    const { data: ideas, error } = await supabaseAdmin
        .from('ideas')
        .select('*')
        .eq('week_published', weekStart)
        .in('status', ['published', 'archived']);

    if (error) throw error;
    if (!ideas || ideas.length === 0) return [];

    // Fetch vote counts in one go
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

    const rankedIdeas = ideas.map(idea => ({
        ...idea,
        votes: voteCountMap[idea.id] || 0,
        category: parseCategory(idea.tags)
    }));

    return rankedIdeas.sort((a, b) => b.votes - a.votes).slice(0, 3);
};

/**
 * Helper to parse category from tags
 */
const parseCategory = (tags) => {
    if (!tags) return 'Startup';
    if (Array.isArray(tags)) {
        return tags[1] || tags[0] || 'Startup';
    }
    return tags.category || 'Startup';
};

/**
 * Get all ideas for a specific week
 */
export const getIdeasByWeek = async (weekStart) => {
    const { data: ideas, error } = await supabase
        .from('ideas')
        .select('*')
        .or('status.eq.published,is_winner.eq.true')
        .eq('week_published', weekStart)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return ideas || [];
};

/**
 * Get a single idea with vote count
 */
export const getIdeaWithVoteCount = async (id) => {
    const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .or('status.eq.published,is_winner.eq.true')
        .single();

    if (ideaError) throw ideaError;

    const { count, error: voteError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', id);

    if (voteError) throw voteError;

    return {
        ...idea,
        voteCount: count || 0
    };
};

/**
 * Get winner for a specific week
 */
export const getWinnerByWeek = async (week) => {
    const { data: batch, error } = await supabase
        .from('weekly_batches')
        .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (*)
      `)
        .eq('week_start_date', week)
        .single();

    if (error) throw error;
    return batch;
};

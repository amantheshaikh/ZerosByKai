import { supabase, supabaseAdmin } from '../config/supabase.js';
import { getMonday } from '../utils/dateUtils.js';

/**
 * Get the latest week that has been fully processed (email sent).
 * This ensures leaderboard only shows weeks where the Monday job has run.
 */
export const getLatestActiveWeek = async () => {
    const { data } = await supabaseAdmin
        .from('weekly_batches')
        .select('week_start_date')
        .not('week_start_date', 'is', null)
        .not('email_sent_at', 'is', null)  // Only consider batches where email was sent
        .gt('week_start_date', '2025-01-01')
        .lte('week_start_date', getMonday())
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();

    return data?.week_start_date || null;
};

/**
 * Get the current active week specifically for voting (published ideas)
 * Cached for 60s since voting week only changes once per week.
 */
let _votingWeekCache = { value: null, expiry: 0 };

export const getVotingWeek = async () => {
    const now = Date.now();
    if (_votingWeekCache.value && now < _votingWeekCache.expiry) {
        return _votingWeekCache.value;
    }

    const { data: latestIdea } = await supabaseAdmin
        .from('ideas')
        .select('week_published')
        .eq('status', 'published')
        .order('week_published', { ascending: false })
        .limit(1)
        .single();

    const week = latestIdea?.week_published || null;
    _votingWeekCache = { value: week, expiry: now + 60_000 };
    return week;
};

/**
 * Calculate leaderboard for a specific week
 * @param {string} weekStart 
 */
export const getLeaderboardForWeek = async (weekStart) => {
    // Fetch ideas for that week, ordered by vote_count
    const { data: ideas, error } = await supabaseAdmin
        .from('ideas')
        .select('*')
        .eq('week_published', weekStart)
        .in('status', ['published', 'archived'])
        .order('vote_count', { ascending: false })
        .limit(3);

    if (error) throw error;
    if (!ideas || ideas.length === 0) return [];

    const rankedIdeas = ideas.map(idea => ({
        ...idea,
        votes: idea.vote_count || 0,
        category: parseCategory(idea.tags)
    }));

    return rankedIdeas;
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


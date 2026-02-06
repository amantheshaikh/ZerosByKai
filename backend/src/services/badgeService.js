import { supabaseAdmin } from '../config/supabase.js';

/**
 * Calculate the user's tier based on badge count
 * @param {number} count 
 * @returns {string} One of: onlooker, field_agent, lead_analyst, head_intelligence, unicorn_hunter
 */
export const calculateTier = (count) => {
    if (count >= 20) return 'unicorn_hunter';
    if (count >= 12) return 'head_intelligence';
    if (count >= 7) return 'lead_analyst';
    if (count >= 3) return 'field_agent';
    return 'onlooker';
};

/**
 * Get all badges for a specific user
 * @param {string} userId 
 */
export const getUserBadges = async (userId) => {
    const { data: badges, error } = await supabaseAdmin
        .from('user_badges')
        .select('*, idea:ideas(*)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

    if (error) throw error;

    const count = badges?.filter(b => b.badge_type === 'kai_pick').length || 0;

    return {
        badges: badges || [],
        count,
        tier: calculateTier(count)
    };
};

/**
 * Check if a user has a specific badge for an idea
 * @param {string} userId 
 * @param {string} ideaId 
 */
export const hasBadge = async (userId, ideaId) => {
    const { data, error } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('idea_id', ideaId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

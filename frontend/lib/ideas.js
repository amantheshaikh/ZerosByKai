import { getApiUrl, apiFetch } from './auth';
import { normalizeIdea } from './utils';

/**
 * Ideas API Service
 */

/**
 * Fetch ideas for the current week
 */
export async function fetchCurrentWeekIdeas() {
    try {
        const url = `${getApiUrl()}/api/ideas/weekly`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch current ideas');
        const data = await res.json();
        return (data.ideas || []).map(normalizeIdea);
    } catch (error) {
        console.error('Error fetching current ideas:', error);
        return [];
    }
}

/**
 * Fetch leaderboard (past winners)
 */
export async function fetchLeaderboard() {
    try {
        const url = `${getApiUrl()}/api/ideas/leaderboard`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        return (data || []).map(normalizeIdea);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

/**
 * Fetch all past weekly batches for the archive
 */
export async function fetchArchiveBatches() {
    try {
        const url = `${getApiUrl()}/api/ideas/weekly-batches`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch archive batches');
        const data = await res.json();

        const batches = data.batches || [];
        return batches.map(batch => ({
            ...batch,
            winner: normalizeIdea(batch.winner),
            ideas: (batch.ideas || []).map(normalizeIdea)
        }));
    } catch (error) {
        console.error('Error fetching archive batches:', error);
        return [];
    }
}

/**
 * Cast a vote for an idea
 */
export async function castVote(ideaId, session) {
    return await apiFetch('/api/votes', {
        method: 'POST',
        body: JSON.stringify({ ideaId }),
    }, session);
}

/**
 * Get user's current vote
 */
export async function getUserVote(session) {
    try {
        const data = await apiFetch('/api/votes/user', {}, session);
        return data.vote?.idea_id || null;
    } catch (error) {
        return null;
    }
}

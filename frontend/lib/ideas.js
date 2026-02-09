/**
 * Ideas API Service
 */
import { getApiUrl, apiFetch } from './auth';
import { normalizeIdea } from './utils';

/**
 * Fetch wrapper with timeout support
 * @param {string} url - Full URL to fetch from
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} Network error or timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        // Distinguish timeout vs other errors
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }

        throw error;
    }
}

/**
 * Fetch ideas for the current week
 */
export async function fetchCurrentWeekIdeas() {
    try {
        const url = `${getApiUrl()}/api/ideas/weekly`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error('Failed to fetch current ideas');
        const data = await res.json();
        return (data.ideas || []).map(normalizeIdea);
    } catch (error) {
        console.error('Error fetching current ideas:', error.message);
        return [];
    }
}

/**
 * Fetch leaderboard (past winners)
 */
export async function fetchLeaderboard() {
    try {
        const url = `${getApiUrl()}/api/ideas/leaderboard`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        return (data || []).map(normalizeIdea);
    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        return [];
    }
}

/**
 * Fetch all past weekly batches for the archive
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 */
export async function fetchArchiveBatches(page = 1, limit = 20) {
    try {
        const url = `${getApiUrl()}/api/ideas/weekly-batches?page=${page}&limit=${limit}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error('Failed to fetch archive batches');
        const data = await res.json();

        const batches = data.batches || [];
        return {
            batches: batches.map(batch => ({
                ...batch,
                winner: normalizeIdea(batch.winner),
                ideas: (batch.ideas || []).map(normalizeIdea)
            })),
            pagination: {
                page: data.page || page,
                limit: data.limit || limit,
                total: data.total || 0,
                pages: data.pages || 0
            }
        };
    } catch (error) {
        console.error('Error fetching archive batches:', error.message);
        return { batches: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
}

/**
 * Fetch a specific weekly batch (ideas + metadata)
 * @param {string} date - ISO date string (YYYY-MM-DD)
 */
export async function fetchWeeklyBatch(date) {
    try {
        const url = `${getApiUrl()}/api/ideas/weekly-batch/${date}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error('Failed to fetch weekly batch');
        const data = await res.json();

        return {
            ...data,
            winner: normalizeIdea(data.winner),
            ideas: (data.ideas || []).map(normalizeIdea)
        };
    } catch (error) {
        console.error('Error fetching weekly batch:', error.message);
        throw error;
    }
}

/**
 * Cast a vote for an idea
 */
export async function castVote(ideaId, session) {
    try {
        return await apiFetch('/api/votes', {
            method: 'POST',
            body: JSON.stringify({ ideaId }),
        }, session);
    } catch (error) {
        console.error('Error casting vote:', error.message);
        throw error;
    }
}

/**
 * Get user's current vote
 */
export async function getUserVote(session) {
    try {
        const data = await apiFetch('/api/votes/user', {}, session);
        return data.vote?.idea_id || null;
    } catch (error) {
        console.error('Error fetching user vote:', error.message);
        return null;
    }
}

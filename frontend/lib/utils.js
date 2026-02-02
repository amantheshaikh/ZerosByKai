/**
 * Frontend Utilities
 */

/**
 * Normalizes an Idea object from the backend/DB to a standard frontend format.
 * This removes reliance on legacy fields and ensures a consistent interface.
 * 
 * @param {Object} idea - The raw idea object from API
 * @returns {Object} Normalized idea
 */
export function normalizeIdea(idea) {
    if (!idea) return null;

    // 1. Tags Normalization
    // New schema uses a JSONB array. Older records might have region/category objects.
    const rawTags = idea.tags || {};
    let tagsList = [];

    if (Array.isArray(rawTags)) {
        tagsList = rawTags;
    } else if (typeof rawTags === 'object' && rawTags !== null) {
        // Backward compatibility for { region, category } - though we aim to phase this out
        if (rawTags.region) tagsList.push(rawTags.region);
        if (rawTags.category) tagsList.push(rawTags.category);
    }

    // Default tag if empty
    if (tagsList.length === 0) {
        tagsList.push('🌍 Global');
    }

    // 2. Mapping inconsistent field names
    return {
        ...idea,
        tagsList,
        // Standardized display fields
        target: idea.target_audience || idea.target || 'General',
        why: idea.why_it_matters || idea.why || '',
        // Keep these for legacy components if needed, but prefer tagsList
        tag: tagsList[0],
        category: tagsList[1] || ''
    };
}

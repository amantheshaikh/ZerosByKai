import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Normalizes an Idea object from the backend/DB to a standard frontend format.
 */
export function normalizeIdea(idea) {
    if (!idea) return null;

    const rawTags = idea.tags || {};
    let tagsList = [];

    if (Array.isArray(rawTags)) {
        tagsList = rawTags;
    } else if (typeof rawTags === 'object' && rawTags !== null) {
        if (rawTags.region) tagsList.push(rawTags.region);
        if (rawTags.category) tagsList.push(rawTags.category);
    }

    if (tagsList.length === 0) {
        tagsList.push('🌍 Global');
    }

    return {
        ...idea,
        tagsList,
        target: idea.target_audience || idea.target || 'General',
        why: idea.why_it_matters || idea.why || '',
        tag: tagsList[0],
        category: tagsList[1] || ''
    };
}

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

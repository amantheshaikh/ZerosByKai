/**
 * Common date utilities for ZerosByKai
 */

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the given week.
 * Defaults to the current week if no date is provided.
 * Map Sunday (0) -> 6, Monday (1) -> 0, etc.
 */
export const getMonday = (date = new Date()) => {
    const d = new Date(date);
    const dayOffset = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - dayOffset);
    return d.toISOString().split('T')[0];
};

/**
 * Returns the ISO date string (YYYY-MM-DD) for last week's Monday.
 */
export const getLastMonday = (date = new Date()) => {
    const currentMonday = new Date(getMonday(date));
    currentMonday.setUTCDate(currentMonday.getUTCDate() - 7);
    return currentMonday.toISOString().split('T')[0];
};

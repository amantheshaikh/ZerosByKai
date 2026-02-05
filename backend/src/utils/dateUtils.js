/**
 * Common date utilities for ZerosByKai
 */

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the given week.
 * Map Sunday (0) -> 6, Monday (1) -> 0, etc.
 */
export const getMonday = (date = new Date()) => {
    const d = new Date(date);
    // If it's late Sunday (after 12 PM), we're effectively in the "Coming Week"
    // This helps manual testing on Sunday night.
    if (d.getUTCDay() === 0 && d.getUTCHours() >= 12) {
        d.setUTCDate(d.getUTCDate() + 1);
    }
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

/**
 * Returns the effective "cutoff date" for visibility.
 * If current time is before cutoffHour (UTC), returns Yesterday.
 * Else returns Today.
 * Used to ensure ideas released on Monday 9 AM don't show up at Monday 0 AM.
 */
export const getVisibilityCutoffDate = (cutoffHour = 9) => {
    const now = new Date();
    // If we are before the release hour, shift strict cutoff to yesterday
    if (now.getUTCHours() < cutoffHour) {
        now.setUTCDate(now.getUTCDate() - 1);
    }
    return now.toISOString().split('T')[0];
};

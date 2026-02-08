import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMonday, getLastMonday } from '../../src/utils/dateUtils.js';

describe('dateUtils.js', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getMonday()', () => {
        it('should return the same date if it is a Monday', () => {
            // 2025-01-06 is a Monday
            const date = new Date('2025-01-06T10:00:00Z');
            expect(getMonday(date)).toBe('2025-01-06');
        });

        it('should return the previous Monday if it is mid-week', () => {
            // 2025-01-08 is a Wednesday
            const date = new Date('2025-01-08T10:00:00Z');
            expect(getMonday(date)).toBe('2025-01-06');
        });

        it('should return the previous Monday if it is Sunday morning', () => {
            // 2025-01-12 is a Sunday
            const date = new Date('2025-01-12T10:00:00Z');
            expect(getMonday(date)).toBe('2025-01-06');
        });

        it('should return the COMING Monday if it is Sunday afternoon (>= 12 PM UTC)', () => {
            // 2025-01-12 is a Sunday
            const date = new Date('2025-01-12T13:00:00Z');
            expect(getMonday(date)).toBe('2025-01-13');
        });

        it('should use current date if no date is provided', () => {
            const mockDate = new Date('2025-01-08T10:00:00Z');
            vi.setSystemTime(mockDate);
            expect(getMonday()).toBe('2025-01-06');
        });
    });

    describe('getLastMonday()', () => {
        it('should return the Monday prior to the current week Monday', () => {
            // Current week Monday is 2025-01-06
            const date = new Date('2025-01-08T10:00:00Z');
            expect(getLastMonday(date)).toBe('2024-12-30');
        });

        it('should handle Sunday afternoon correctly for last Monday', () => {
            // 2025-01-12 Sunday Afternoon -> getMonday returns 2025-01-13
            // So getLastMonday should return 2025-01-06
            const date = new Date('2025-01-12T13:00:00Z');
            expect(getLastMonday(date)).toBe('2025-01-06');
        });
    });
});

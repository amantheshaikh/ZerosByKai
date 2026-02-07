import { describe, it, expect } from 'vitest';
import { normalizeIdea, cn } from '../../lib/utils';

describe('Utils Library', () => {
    describe('normalizeIdea', () => {
        it('returns null for null/undefined input', () => {
            expect(normalizeIdea(null)).toBeNull();
            expect(normalizeIdea(undefined)).toBeNull();
        });

        it('normalizes idea with array tags', () => {
            const idea = {
                id: 1,
                name: 'Test Idea',
                tags: ['Tech', 'SaaS'],
                target_audience: 'Developers',
                why_it_matters: 'Big market',
            };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['Tech', 'SaaS']);
            expect(result.tag).toBe('Tech');
            expect(result.category).toBe('SaaS');
            expect(result.target).toBe('Developers');
            expect(result.why).toBe('Big market');
        });

        it('normalizes idea with object tags (region/category)', () => {
            const idea = {
                id: 2,
                name: 'Regional Idea',
                tags: { region: 'US', category: 'Fintech' },
            };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['US', 'Fintech']);
            expect(result.tag).toBe('US');
            expect(result.category).toBe('Fintech');
        });

        it('adds default Global tag when no tags provided', () => {
            const idea = { id: 3, name: 'No Tags Idea' };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['🌍 Global']);
            expect(result.tag).toBe('🌍 Global');
        });

        it('adds default Global tag for empty tags array', () => {
            const idea = { id: 4, name: 'Empty Tags', tags: [] };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['🌍 Global']);
        });

        it('adds default Global tag for empty tags object', () => {
            const idea = { id: 5, name: 'Empty Object Tags', tags: {} };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['🌍 Global']);
        });

        it('uses fallback fields (target, why) when primary fields missing', () => {
            const idea = {
                id: 6,
                name: 'Fallback Idea',
                target: 'Startups',
                why: 'Growing market',
            };

            const result = normalizeIdea(idea);

            expect(result.target).toBe('Startups');
            expect(result.why).toBe('Growing market');
        });

        it('defaults target to General when missing', () => {
            const idea = { id: 7, name: 'No Target' };

            const result = normalizeIdea(idea);

            expect(result.target).toBe('General');
        });

        it('preserves original idea properties', () => {
            const idea = {
                id: 8,
                name: 'Full Idea',
                problem: 'A problem',
                solution: 'A solution',
                custom_field: 'custom value',
            };

            const result = normalizeIdea(idea);

            expect(result.id).toBe(8);
            expect(result.name).toBe('Full Idea');
            expect(result.problem).toBe('A problem');
            expect(result.solution).toBe('A solution');
            expect(result.custom_field).toBe('custom value');
        });

        it('handles partial object tags (only region)', () => {
            const idea = {
                id: 9,
                name: 'Region Only',
                tags: { region: 'EU' },
            };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['EU']);
            expect(result.tag).toBe('EU');
            expect(result.category).toBe('');
        });

        it('handles partial object tags (only category)', () => {
            const idea = {
                id: 10,
                name: 'Category Only',
                tags: { category: 'Healthcare' },
            };

            const result = normalizeIdea(idea);

            expect(result.tagsList).toEqual(['Healthcare']);
            expect(result.tag).toBe('Healthcare');
        });
    });

    describe('cn', () => {
        it('merges simple class names', () => {
            expect(cn('foo', 'bar')).toBe('foo bar');
        });

        it('filters out falsy values', () => {
            expect(cn('foo', null, 'bar', undefined, false, 'baz')).toBe('foo bar baz');
        });

        it('handles conditional classes', () => {
            const isActive = true;
            const isDisabled = false;

            expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
        });

        it('merges conflicting Tailwind classes (last wins)', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2');
            expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        });

        it('handles array inputs', () => {
            expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
        });

        it('handles object inputs (clsx style)', () => {
            expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
        });

        it('returns empty string for no inputs', () => {
            expect(cn()).toBe('');
        });

        it('handles complex Tailwind merging', () => {
            expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
            expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
        });
    });
});

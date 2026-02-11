import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleNewsletter } from '../../src/jobs/schedule_newsletter.js';
import { supabaseAdmin } from '../../src/config/supabase.js';
import { AIService } from '../../src/services/aiService.js';
import { pickAndPublishIdeas } from '../../src/services/newsletterService.js';

// Mock all internal dependencies
vi.mock('../../src/config/supabase.js', () => {
    const mock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        then: vi.fn(function (resolve) {
            return Promise.resolve({ data: [], error: null }).then(resolve);
        })
    };
    return { supabaseAdmin: mock };
});

vi.mock('../../src/services/newsletterService.js', () => ({
    pickAndPublishIdeas: vi.fn()
}));

vi.mock('../../src/services/aiService.js', () => {
    return {
        AIService: class {
            generateNewsletterSubject = vi.fn().mockResolvedValue('AI Subject');
        }
    };
});

vi.mock('../../src/config/env.js', () => ({
    config: {
        frontendUrl: 'http://localhost:3000'
    }
}));

describe('schedule_newsletter.js', () => {
    const originalArgv = process.argv;
    const originalExit = process.exit;

    beforeEach(() => {
        vi.clearAllMocks();
        process.exit = vi.fn();
        // Default supabase mock behavior
        supabaseAdmin.then.mockImplementation(function (resolve) {
            return Promise.resolve({ data: [], error: null }).then(resolve);
        });
        // Silence console during tests
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        process.argv = originalArgv;
        process.exit = originalExit;
    });

    it('should show usage and exit if no args provided', async () => {
        process.argv = ['node', 'schedule_newsletter.js'];
        await scheduleNewsletter();
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    });

    it('should calculate target date correctly with --weeks', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', '1'];
        pickAndPublishIdeas.mockResolvedValueOnce([{ id: '1' }]);
        supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f));

        await scheduleNewsletter();

        expect(pickAndPublishIdeas).toHaveBeenCalledWith(expect.any(Date));
        expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should parse specific date with --date', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--date', '2025-02-17'];
        pickAndPublishIdeas.mockResolvedValueOnce([{ id: '1' }]);
        supabaseAdmin.then.mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1' }, error: null }).then(f));

        await scheduleNewsletter();

        expect(pickAndPublishIdeas).toHaveBeenCalledWith(new Date('2025-02-17'));
    });

    it('should handle existing batches and fetch ideas', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', '1'];
        pickAndPublishIdeas.mockResolvedValueOnce({ total_ideas: 10 });

        supabaseAdmin.then
            .mockImplementationOnce(f => Promise.resolve({ data: [{ id: '1' }], error: null }).then(f)) // fetchedIdeas
            .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1', subject_line: 'Existing' }, error: null }).then(f)); // batch

        await scheduleNewsletter();

        expect(supabaseAdmin.from).toHaveBeenCalledWith('ideas');
    });

    it('should call AIService if subject line is missing', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', '1'];
        pickAndPublishIdeas.mockResolvedValueOnce([{ id: '1' }]);

        supabaseAdmin.then
            .mockImplementationOnce(f => Promise.resolve({ data: { id: 'batch1', subject_line: null }, error: null }).then(f)) // batch check
            .mockImplementationOnce(f => Promise.resolve({ data: null, error: null }).then(f)) // lastWeekBatch
            .mockImplementationOnce(f => Promise.resolve({ error: null }).then(f)); // update subject

        await scheduleNewsletter();

        expect(supabaseAdmin.update).toHaveBeenCalledWith({ subject_line: 'AI Subject' });
    });

    it('should exit with 1 on failure', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', '1'];
        const error = new Error('Pick Error');
        pickAndPublishIdeas.mockRejectedValueOnce(error);

        await scheduleNewsletter();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith('Error scheduling newsletter:', error);
    });
    it('should exit with 1 if --weeks argument is invalid', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', 'abc'];
        await scheduleNewsletter();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 if --date argument is invalid', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--date', 'invalid-date'];
        await scheduleNewsletter();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should exit with 1 if no ideas are returned', async () => {
        process.argv = ['node', 'schedule_newsletter.js', '--weeks', '1'];
        pickAndPublishIdeas.mockResolvedValueOnce([]); // Empty array

        await scheduleNewsletter();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to pick 10 ideas'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});

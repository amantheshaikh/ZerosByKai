import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runScraperFlow, scrapeReddit, getExistingIdeaTitles } from '../../../src/jobs/scrapers/run_scrapers.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { AIService } from '../../../src/services/aiService.js';
import { fetchSubreddit } from '../../../src/jobs/scrapers/reddit_api.js';
import { scrapeHackerNews } from '../../../src/jobs/scrapers/hn_scraper.js';
import { scrapeIndieHackers } from '../../../src/jobs/scrapers/ih_scraper.js';
import { scrapeX } from '../../../src/jobs/scrapers/x_scraper_apify.js';

// Use vi.hoisted for variables needed in vi.mock
const { mockAIService } = vi.hoisted(() => ({
    mockAIService: {
        setExclusionList: vi.fn(),
        generateIdeas: vi.fn(),
        dedupeAndSynthesizeIdeas: vi.fn().mockResolvedValue([{ name: 'Final Idea', title: 'Final Title', problem: 'FP', solution: 'FS', target: 'FT', why: 'FW', tags: ['FA'] }])
    }
}));

// Mock dependencies
vi.mock('../../../src/config/supabase.js', () => ({
    supabaseAdmin: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn(),
        then: vi.fn()
    }
}));

vi.mock('../../../src/services/aiService.js', () => ({
    AIService: class {
        constructor() {
            return mockAIService;
        }
    }
}));

vi.mock('../../../src/jobs/scrapers/reddit_api.js', () => ({ fetchSubreddit: vi.fn() }));
vi.mock('../../../src/jobs/scrapers/hn_scraper.js', () => ({ scrapeHackerNews: vi.fn() }));
vi.mock('../../../src/jobs/scrapers/ih_scraper.js', () => ({ scrapeIndieHackers: vi.fn() }));
vi.mock('../../../src/jobs/scrapers/x_scraper_apify.js', () => ({ scrapeX: vi.fn() }));
vi.mock('../../../src/utils/helpers.js', () => ({ wait: vi.fn().mockResolvedValue() }));
vi.mock('../../../src/config/env.js', () => ({ config: { some: 'config' } }));

describe('run_scrapers.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default successful mocks
        fetchSubreddit.mockResolvedValue([{
            title: 'Substantive Title for Reddit Post with enough characters',
            body: 'Substantive Body for Reddit Post that is over forty characters long',
            created_utc: Math.floor(Date.now() / 1000)
        }]);
        scrapeHackerNews.mockResolvedValue([{
            title: 'Substantive Title for HN Post with enough characters',
            body: 'Substantive Body for HN Post that is over forty characters long'
        }]);
        scrapeIndieHackers.mockResolvedValue([{
            title: 'Substantive Title for IH Post with enough characters',
            body: 'Substantive Body for IH Post that is over forty characters long'
        }]);
        scrapeX.mockResolvedValue([{ full_text: 'Tweet content' }]);

        mockAIService.generateIdeas.mockResolvedValue([{ name: 'Idea 1', title: 'Title 1', problem: 'P', solution: 'S', target: 'T', why: 'W', tags: ['A'] }]);

        supabaseAdmin.insert.mockResolvedValue({ error: null });
        supabaseAdmin.then.mockImplementation(resolve => Promise.resolve({ data: [], error: null }).then(resolve));
    });

    describe('getExistingIdeaTitles()', () => {
        it('should fetch and format existing idea titles', async () => {
            supabaseAdmin.then.mockImplementationOnce(resolve =>
                Promise.resolve({ data: [{ name: 'IdeaA', title: 'TitleA' }], error: null }).then(resolve)
            );

            const titles = await getExistingIdeaTitles();
            expect(titles).toEqual(['TitleA']);
            expect(supabaseAdmin.from).toHaveBeenCalledWith('ideas');
        });

        it('should return empty array on error or no data', async () => {
            supabaseAdmin.then.mockImplementationOnce(resolve =>
                Promise.resolve({ data: null, error: new Error('DB Error') }).then(resolve)
            );
            const titles = await getExistingIdeaTitles();
            expect(titles).toEqual([]);
        });
    });

    describe('scrapeReddit()', () => {
        it('should fetch posts from subreddits and filter by date', async () => {
            const now = Math.floor(Date.now() / 1000);
            fetchSubreddit.mockResolvedValue([
                { subreddit: 'Business_Ideas', title: 'New', created_utc: now - 100 },
                { subreddit: 'Business_Ideas', title: 'Old', created_utc: now - (20 * 24 * 60 * 60) }
            ]);

            const posts = await scrapeReddit();

            expect(posts.length).toBeGreaterThan(0);
            // We expect 16 subreddits to be selected (8 tech, 8 everyday)
            // But since our mock returns all items for each chunk, we just check if filtering works
            posts.forEach(p => {
                expect(p.created_utc).toBeGreaterThan(now - (16 * 24 * 60 * 60));
            });
        });
    });

    describe('runScraperFlow()', () => {
        it('should run the full flow successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await runScraperFlow();

            expect(fetchSubreddit).toHaveBeenCalled();
            expect(scrapeHackerNews).toHaveBeenCalled();
            expect(scrapeIndieHackers).toHaveBeenCalled();
            expect(scrapeX).toHaveBeenCalled();

            expect(supabaseAdmin.from).toHaveBeenCalledWith('ideas');
            expect(supabaseAdmin.insert).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle partial scraper failures using allSettled', async () => {
            scrapeHackerNews.mockRejectedValue(new Error('HN Down'));
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await runScraperFlow();

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Some scraper sources failed'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('HN failed'), 'HN Down');

            expect(supabaseAdmin.insert).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should abort if no substantive posts are found', async () => {
            fetchSubreddit.mockResolvedValue([]);
            scrapeHackerNews.mockResolvedValue([]);
            scrapeIndieHackers.mockResolvedValue([]);
            scrapeX.mockResolvedValue([]);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await runScraperFlow();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No substantive posts from any source'));
            expect(supabaseAdmin.insert).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should support dry-run mode', async () => {
            process.argv.push('--dry-run');
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await runScraperFlow();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DRY RUN]'));
            expect(supabaseAdmin.insert).not.toHaveBeenCalled();

            process.argv.pop();
            consoleSpy.mockRestore();
        });

        it('should handle AI generation failure gracefully', async () => {
            mockAIService.generateIdeas.mockRejectedValueOnce(new Error('AI Busy'));
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await runScraperFlow();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('generation failed: AI Busy'));
            expect(supabaseAdmin.insert).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should fallback to all generated ideas if dedupe fails', async () => {
            mockAIService.dedupeAndSynthesizeIdeas.mockRejectedValue(new Error('Synthesis Error'));
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            await runScraperFlow();

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Falling back to all'));
            expect(supabaseAdmin.insert).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });
});

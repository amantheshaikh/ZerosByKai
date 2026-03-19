import { config } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { AIService } from '../../services/aiService.js';
import { fetchSubreddit } from './reddit_api.js';
import { scrapeHackerNews } from './hn_scraper.js';
import { scrapeIndieHackers } from './ih_scraper.js';
import { scrapeX } from './x_scraper_apify.js';
import { wait } from '../../utils/helpers.js';

const SUBREDDITS = [
    // Core Business & Startup (High Signal)
    { name: 'Business_Ideas', sort: 'hot' },
    { name: 'SaaS', sort: 'hot' },
    { name: 'webdev', sort: 'hot' },
    { name: 'SideProject', sort: 'new' },
    { name: 'smallbusiness', sort: 'top', time: 'week' },
    { name: 'roastmystartup', sort: 'new' },
    { name: 'indiehackers', sort: 'hot' },
    { name: 'startups', sort: 'hot' },
    { name: 'nocode', sort: 'hot' },
    { name: 'Entrepreneur', sort: 'hot' },
    { name: 'startup', sort: 'hot' },
    { name: 'Startup_Ideas', sort: 'new' },
    
    // New Verticals (Diversity)
    { name: 'personalfinance', sort: 'hot' },
    { name: 'fitness', sort: 'hot' },
    { name: 'HealthyFood', sort: 'hot' },
    { name: 'edtech', sort: 'hot' },
    { name: 'ecommerce', sort: 'hot' },
    { name: 'retail', sort: 'hot' },
    { name: 'fintech', sort: 'hot' },
    
    // Local / Regional (Specific problems)
    { name: 'nyc', sort: 'hot' },
    { name: 'sanfrancisco', sort: 'hot' }
];

const aiService = new AIService(config);

export async function runScraperFlow() {
    console.log(`Starting Multi-Source Idea Scraper (Reddit, HN, IH, X)...`);

    // 1. Fetch data from all sources in parallel (allSettled to prevent single source failure)
    const results = await Promise.allSettled([
        scrapeReddit(),
        scrapeHackerNews(),
        scrapeIndieHackers(),
        scrapeX()
    ]);

    const redditPosts = results[0].status === 'fulfilled' ? results[0].value : [];
    const hnPosts = results[1].status === 'fulfilled' ? results[1].value : [];
    const ihPosts = results[2].status === 'fulfilled' ? results[2].value : [];
    const xPosts = results[3].status === 'fulfilled' ? results[3].value : [];

    if (results.some(r => r.status === 'rejected')) {
        console.warn('⚠️ Some scraper sources failed to load:');
        if (results[0].status === 'rejected') console.error('- Reddit failed:', results[0].reason?.message);
        if (results[1].status === 'rejected') console.error('- HN failed:', results[1].reason?.message);
        if (results[2].status === 'rejected') console.error('- IH failed:', results[2].reason?.message);
        if (results[3].status === 'rejected') console.error('- X (Apify) failed:', results[3].reason?.message);
    }

    console.log(`\n📊 Scraping Summary:`);
    console.log(`   Reddit: ${redditPosts.length} posts`);
    console.log(`   HN: ${hnPosts.length} posts`);
    console.log(`   IH: ${ihPosts.length} posts`);
    console.log(`   X: ${xPosts.length} posts`);

    // Filter substantive items per source (adjusted for brevity of tweets)
    const redditSubstantive = redditPosts.filter(p => (p.body?.length > 40) || (p.title?.length > 20));
    const hnSubstantive = hnPosts.filter(p => (p.body?.length > 40) || (p.title?.length > 20));
    const ihSubstantive = ihPosts.filter(p => (p.body?.length > 40) || (p.title?.length > 20));
    const xSubstantive = xPosts.filter(p => true); // Tweets are short by nature

    if (!redditSubstantive.length && !hnSubstantive.length && !ihSubstantive.length && !xSubstantive.length) {
        console.log('❌ No substantive posts from any source. Aborting.');
        return;
    }

    // 2. Set exclusion list from existing published ideas
    const existingIdeas = await getExistingIdeaTitles();
    console.log(`[Scraper] Exclusion list: using last ${existingIdeas.length} published ideas`);
    aiService.setExclusionList(existingIdeas);

    // ===== STAGE 1: Generate ideas from each source independently (up to 15 each) =====
    console.log(`\n🔄 STAGE 1: Generating ideas from each source...`);

    const generatedIdeasBySource = {
        reddit: [],
        hn: [],
        ih: [],
        x: []
    };

    // Reddit: Generate up to 15 ideas
    if (redditSubstantive.length > 0) {
        try {
            const batch = redditSubstantive.slice(0, 40); // Use up to 40 posts
            console.log(`  🔹 Reddit: generating from ${batch.length} posts...`);
            generatedIdeasBySource.reddit = await aiService.generateIdeas(batch, 15);
            console.log(`     ✅ Generated ${generatedIdeasBySource.reddit.length} ideas from Reddit`);
        } catch (e) {
            console.error(`  ❌ Reddit generation failed: ${e.message}`);
        }
        await wait(2000); // Rate limit between sources
    }

    // Hacker News: Generate up to 15 ideas
    if (hnSubstantive.length > 0) {
        try {
            const batch = hnSubstantive.slice(0, 40);
            console.log(`  🔹 HN: generating from ${batch.length} posts...`);
            generatedIdeasBySource.hn = await aiService.generateIdeas(batch, 15);
            console.log(`     ✅ Generated ${generatedIdeasBySource.hn.length} ideas from HN`);
        } catch (e) {
            console.error(`  ❌ HN generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // Indie Hackers: Generate up to 15 ideas
    if (ihSubstantive.length > 0) {
        try {
            const batch = ihSubstantive.slice(0, 40);
            console.log(`  🔹 IH: generating from ${batch.length} posts...`);
            generatedIdeasBySource.ih = await aiService.generateIdeas(batch, 15);
            console.log(`     ✅ Generated ${generatedIdeasBySource.ih.length} ideas from IH`);
        } catch (e) {
            console.error(`  ❌ IH generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // X/Twitter: Generate up to 15 ideas
    if (xSubstantive.length > 0) {
        try {
            const batch = xSubstantive.slice(0, 40);
            console.log(`  🔹 X: generating from ${batch.length} tweets...`);
            generatedIdeasBySource.x = await aiService.generateIdeas(batch, 15);
            console.log(`     ✅ Generated ${generatedIdeasBySource.x.length} ideas from X`);
        } catch (e) {
            console.error(`  ❌ X generation failed: ${e.message}`);
        }
    }

    const totalGenerated = Object.values(generatedIdeasBySource).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n📈 Stage 1 Summary: ${totalGenerated} total ideas generated`);

    if (totalGenerated === 0) {
        console.log('❌ No ideas generated from any source. Aborting.');
        return;
    }

    // ===== STAGE 2: Dedupe and synthesize ideas (final list, up to 40) =====
    console.log(`\n🔄 STAGE 2: Deduping and synthesizing ${totalGenerated} ideas...`);
    let finalIdeas = [];
    try {
        finalIdeas = await aiService.dedupeAndSynthesizeIdeas(generatedIdeasBySource);
        console.log(`✅ Final curated list: ${finalIdeas.length} ideas`);
    } catch (e) {
        console.error(`❌ Dedupe/synthesis failed: ${e.message}`);
        // Fallback: Use all generated ideas without deduplication
        finalIdeas = Object.values(generatedIdeasBySource).flat();
        console.warn(`⚠️ Falling back to all ${finalIdeas.length} generated ideas without deduplication`);
    }

    // 3. Save to DB
    if (finalIdeas.length > 0) {
        const rows = finalIdeas.map(idea => ({
            name: idea.name,
            title: idea.title,
            problem: (idea.problem || '').substring(0, 180),
            solution: (idea.solution || '').substring(0, 180),
            target_audience: idea.target,
            why_it_matters: (idea.why || '').substring(0, 180),
            tags: idea.tags,
            status: 'backlog'
        }));

        if (process.argv.includes('--dry-run')) {
            console.log(`\n[DRY RUN] Would have saved ${rows.length} ideas to backlog:`);
            rows.forEach((r, i) => console.log(`${i + 1}. ${r.name}: ${r.title}`));
            return;
        }

        const { error } = await supabaseAdmin.from('ideas').insert(rows);
        if (error) throw error;

        console.log(`✅ Saved ${finalIdeas.length} ideas to backlog.`);
    } else {
        console.log('⚠️ No ideas to save.');
    }
}

// source-specific wrappers
export async function scrapeReddit() {
    // Pick a random subset of 12 subreddits for this run to optimize diversity and avoid rate limits
    const numToPick = Math.min(12, SUBREDDITS.length);
    const selectedSubreddits = [...SUBREDDITS]
        .sort(() => 0.5 - Math.random())
        .slice(0, numToPick);

    console.log(`Scraping Reddit (${selectedSubreddits.length} subreddits selected)...`);
    console.log(`  Targets: ${selectedSubreddits.map(s => s.name).join(', ')}`);

    let posts = [];
    const CHUNK_SIZE = 4;
    const fifteenDaysAgo = Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60);

    for (let i = 0; i < selectedSubreddits.length; i += CHUNK_SIZE) {
        const chunk = selectedSubreddits.slice(i, i + CHUNK_SIZE);
        try {
            const results = await Promise.all(chunk.map(s => fetchSubreddit(s.name, s.sort, s.time, 15, config)));
            posts = [...posts, ...results.flat()];
        } catch (e) {
            console.error(`Reddit chunk failed: ${e.message}`);
        }
        await wait(1500); // Be gentler between chunks
    }

    // Normalize and Filter Freshness
    return posts
        .filter(p => p.created_utc > fifteenDaysAgo)
        .map(p => ({ ...p, source: `r/${p.subreddit}` }));
}



export async function getExistingIdeaTitles() {
    const { data } = await supabaseAdmin
        .from('ideas')
        .select('title')
        .order('created_at', { ascending: false })
        .limit(100);
    return data?.map(i => i.title) || [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runScraperFlow()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

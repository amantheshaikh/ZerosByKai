import { config } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { AIService } from '../../services/aiService.js';
import { fetchSubreddit } from './reddit_api.js';
import { scrapeHackerNews } from './hn_scraper.js';
import { scrapeIndieHackers } from './ih_scraper.js';
import { scrapeX } from './x_scraper_apify.js';
import { wait } from '../../utils/helpers.js';

const TECH_SOURCES = [
    { name: 'Business_Ideas', sort: 'hot' },
    { name: 'SaaS', sort: 'hot' },
    { name: 'webdev', sort: 'hot' },
    { name: 'SideProject', sort: 'new' },
    { name: 'roastmystartup', sort: 'new' },
    { name: 'indiehackers', sort: 'hot' },
    { name: 'startups', sort: 'hot' },
    { name: 'nocode', sort: 'hot' },
    { name: 'Entrepreneur', sort: 'hot' },
    { name: 'startup', sort: 'hot' },
    { name: 'Startup_Ideas', sort: 'new' }
];

const EVERYDAY_SOURCES = [
    // Consumer & Lifestyle
    { name: 'travel', sort: 'hot' },
    { name: 'parenting', sort: 'hot' },
    { name: 'cooking', sort: 'hot' },
    { name: 'productivity', sort: 'hot' },
    { name: 'hobbies', sort: 'hot' },
    { name: 'homeowners', sort: 'hot' },
    { name: 'LifeProTips', sort: 'hot' },
    { name: 'dating_advice', sort: 'hot' },
    { name: 'weddingplanning', sort: 'hot' },
    { name: 'TravelHacks', sort: 'hot' },
    { name: 'dance', sort: 'hot' },
    { name: 'personalfinance', sort: 'hot' },
    { name: 'fitness', sort: 'hot' },
    { name: 'HealthyFood', sort: 'hot' },
    { name: 'edtech', sort: 'hot' },
    { name: 'ecommerce', sort: 'hot' },
    { name: 'retail', sort: 'hot' },
    { name: 'fintech', sort: 'hot' },

    // New "Everyday Product" Verticals
    { name: 'specializedtools', sort: 'hot' },
    { name: 'BuyItForLife', sort: 'hot' },
    { name: 'HomeImprovement', sort: 'hot' },
    { name: 'gardening', sort: 'hot' },
    { name: 'logistics', sort: 'hot' },
    { name: 'supplychain', sort: 'hot' },
    { name: 'Restaurant_Managers', sort: 'hot' },
    { name: 'Photography', sort: 'hot' },
    { name: 'AutoRepair', sort: 'hot' },
    { name: 'Construction', sort: 'hot' },
    { name: 'petowners', sort: 'hot' }
];

const SUBREDDITS = [...TECH_SOURCES, ...EVERYDAY_SOURCES];

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

    // 2. Set exclusion list from existing published ideas
    const existingIdeas = await getExistingIdeaContext();
    console.log(`[Scraper] Exclusion list: using last ${existingIdeas.length} ideas with full context`);
    aiService.setExclusionList(existingIdeas);

    // 2b. Filter out already processed posts
    const { data: processedRecords } = await supabaseAdmin.from('processed_posts').select('external_id');
    const processedIds = new Set(processedRecords?.map(r => r.external_id) || []);
    
    const initialRedditCount = redditSubstantive.length;
    const initialHnCount = hnSubstantive.length;

    const filteredReddit = redditSubstantive.filter(p => !processedIds.has(p.id || p.url));
    const filteredHn = hnSubstantive.filter(p => !processedIds.has(String(p.id)));

    console.log(`\n🧹 Filtering already processed content:`);
    console.log(`   Reddit: ${filteredReddit.length}/${initialRedditCount} new posts`);
    console.log(`   HN: ${filteredHn.length}/${initialHnCount} new posts`);

    if (filteredReddit.length === 0 && filteredHn.length === 0) {
        console.log('✅ All fetched posts have already been processed. Nothing new to do.');
        return;
    }

    // ===== STAGE 1: Generate ideas from each source independently =====
    console.log(`\n🔄 STAGE 1: Generating ideas from each source...`);

    const generatedIdeasBySource = {
        reddit_tech: [],
        reddit_everyday: [],
        hn: [],
        ih: [],
        x: []
    };

    // Reddit Split:
    const techSubreddits = TECH_SOURCES.map(s => `r/${s.name}`);
    const filteredTech = filteredReddit.filter(p => techSubreddits.includes(p.source));
    const filteredEveryday = filteredReddit.filter(p => !techSubreddits.includes(p.source));

    // Reddit Tech: Generate up to 8 ideas
    if (filteredTech.length > 0) {
        try {
            const batch = filteredTech.slice(0, 30);
            console.log(`  🔹 Reddit (Tech): generating from ${batch.length} posts...`);
            generatedIdeasBySource.reddit_tech = await aiService.generateIdeas(batch, 8);
            console.log(`     ✅ Generated ${generatedIdeasBySource.reddit_tech.length} ideas`);
        } catch (e) {
            console.error(`  ❌ Reddit Tech generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // Reddit Everyday: Generate up to 12 ideas (Weighted higher)
    if (filteredEveryday.length > 0) {
        try {
            const batch = filteredEveryday.slice(0, 30);
            console.log(`  🔹 Reddit (Everyday): generating from ${batch.length} posts...`);
            generatedIdeasBySource.reddit_everyday = await aiService.generateIdeas(batch, 12);
            console.log(`     ✅ Generated ${generatedIdeasBySource.reddit_everyday.length} ideas`);
        } catch (e) {
            console.error(`  ❌ Reddit Everyday generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // Hacker News: Generate up to 8 ideas (Reduced from 15)
    if (filteredHn.length > 0) {
        try {
            const batch = filteredHn.slice(0, 30);
            console.log(`  🔹 HN: generating from ${batch.length} posts...`);
            generatedIdeasBySource.hn = await aiService.generateIdeas(batch, 8);
            console.log(`     ✅ Generated ${generatedIdeasBySource.hn.length} ideas`);
        } catch (e) {
            console.error(`  ❌ HN generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // Indie Hackers: Generate up to 8 ideas (Reduced from 15)
    if (ihSubstantive.length > 0) {
        try {
            const batch = ihSubstantive.slice(0, 30);
            console.log(`  🔹 IH: generating from ${batch.length} posts...`);
            generatedIdeasBySource.ih = await aiService.generateIdeas(batch, 8);
            console.log(`     ✅ Generated ${generatedIdeasBySource.ih.length} ideas`);
        } catch (e) {
            console.error(`  ❌ IH generation failed: ${e.message}`);
        }
        await wait(2000);
    }

    // X/Twitter: Generate up to 8 ideas (Reduced from 15)
    if (xSubstantive.length > 0) {
        try {
            const batch = xSubstantive.slice(0, 30);
            console.log(`  🔹 X: generating from ${batch.length} tweets...`);
            generatedIdeasBySource.x = await aiService.generateIdeas(batch, 8);
            console.log(`     ✅ Generated ${generatedIdeasBySource.x.length} ideas`);
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
            target_audience: (idea.target_audience || idea.target || 'General Niche').substring(0, 100),
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

        // 4. Mark posts as processed
        const postsToMark = [
            ...filteredReddit.map(p => ({ external_id: p.id || p.url, source: 'reddit' })),
            ...filteredHn.map(p => ({ external_id: String(p.id), source: 'hacker_news' }))
        ];

        if (postsToMark.length > 0) {
            const { error: markError } = await supabaseAdmin
                .from('processed_posts')
                .upsert(postsToMark, { onConflict: 'external_id' });
            
            if (markError) console.error('⚠️ Failed to mark posts as processed:', markError.message);
            else console.log(`💾 Marked ${postsToMark.length} posts as processed.`);
        }
    } else {
        console.log('⚠️ No ideas to save.');
    }
}

// source-specific wrappers
export async function scrapeReddit() {
    // Balanced selection: 8 from Tech, 8 from Everyday to ensure diversity
    const selectedTech = [...TECH_SOURCES]
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);
    
    const selectedEveryday = [...EVERYDAY_SOURCES]
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);

    const selectedSubreddits = [...selectedTech, ...selectedEveryday];

    console.log(`Scraping Reddit (${selectedSubreddits.length} subreddits selected)...`);
    console.log(`  Targets: ${selectedSubreddits.map(s => s.name).join(', ')}`);

    let posts = [];
    const CHUNK_SIZE = 4;
    const fifteenDaysAgo = Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60);

    for (let i = 0; i < selectedSubreddits.length; i += CHUNK_SIZE) {
        const chunk = selectedSubreddits.slice(i, i + CHUNK_SIZE);
        try {
            const results = await Promise.all(chunk.map(s => fetchSubreddit(s.name, s.sort, s.time, 25, config)));
            const items = results.flat();

            // Quality Filter: Pick top 15 by engagement (score + comments) per source chunk
            const filtered = items
                .sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments))
                .slice(0, 15);

            posts = [...posts, ...filtered];
        } catch (e) {
            console.error(`Reddit chunk failed: ${e.message}`);
        }
        await wait(20000); // 20s delay to stay within free-tier limits
    }

    // Normalize and Filter Freshness
    return posts
        .filter(p => p.created_utc > fifteenDaysAgo)
        .map(p => ({ ...p, source: `r/${p.subreddit}` }));
}



export async function getExistingIdeaContext() {
    const { data } = await supabaseAdmin
        .from('ideas')
        .select('name, title, problem')
        .order('created_at', { ascending: false })
        .limit(100);
    return data || [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runScraperFlow()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

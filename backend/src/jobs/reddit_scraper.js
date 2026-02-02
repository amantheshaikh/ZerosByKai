import { config } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AIService } from '../services/aiService.js';
import { fetchSubreddit } from '../services/redditService.js';
import { notifyAdmin } from './helpers/notifications.js'; // Assuming we extract this too or keep it simple
import { wait } from '../utils/helpers.js';

const SUBREDDITS = [
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
    { name: 'Startup_Ideas', sort: 'new' }
];

const aiService = new AIService(config);

async function runRedditFlow() {
    console.log(`Starting Refactored Reddit Scraper...`);

    // 1. Fetch data in parallel chunks
    let allPosts = [];
    const CHUNK_SIZE = 3;
    for (let i = 0; i < SUBREDDITS.length; i += CHUNK_SIZE) {
        const chunk = SUBREDDITS.slice(i, i + CHUNK_SIZE);
        const results = await Promise.all(chunk.map(s => fetchSubreddit(s.name, s.sort, s.time, 15, config)));
        allPosts = [...allPosts, ...results.flat()];
        await wait(1000);
    }

    const substantiveItems = allPosts.filter(p => (p.body?.length > 40) || (p.title?.length > 30));
    console.log(`Scraped ${allPosts.length} items, ${substantiveItems.length} substantive.`);

    if (substantiveItems.length === 0) return;

    // 2. Deduplicate
    const existingIdeas = await getExistingIdeaTitles();
    aiService.setExclusionList(existingIdeas);

    // 3. Generate with AI
    const GENERATION_TARGET = 15;
    const shuffled = substantiveItems.sort(() => 0.5 - Math.random());
    const batch = shuffled.slice(0, 30);

    console.log(`Generating ${GENERATION_TARGET} ideas...`);
    const ideas = await aiService.generateIdeas(batch, GENERATION_TARGET);

    // 4. Save to DB
    if (ideas.length > 0) {
        const rows = ideas.map(idea => ({
            name: idea.name,
            title: idea.title,
            problem: idea.problem,
            solution: idea.solution,
            target_audience: idea.target,
            why_it_matters: idea.why,
            tags: idea.tags,
            status: 'backlog'
        }));

        const { error } = await supabaseAdmin.from('ideas').insert(rows);
        if (error) throw error;

        console.log(`✅ Saved ${ideas.length} ideas to backlog.`);
    }
}

async function getExistingIdeaTitles() {
    const { data } = await supabaseAdmin
        .from('ideas')
        .select('title, name')
        .order('created_at', { ascending: false })
        .limit(300);
    return data?.map(i => `${i.name}: ${i.title}`) || [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runRedditFlow()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

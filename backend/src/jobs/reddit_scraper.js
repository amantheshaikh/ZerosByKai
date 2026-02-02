
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { supabaseAdmin } from '../config/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env if not already loaded (for standalone script usage)
if (!process.env.RESEND_API_KEY) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Extensive Subreddit List (20+)
const SUBREDDITS = [
    // Curated High-Signal List
    { name: 'Business_Ideas', sort: 'hot' },
    { name: 'SaaS', sort: 'hot' },
    { name: 'webdev', sort: 'hot' },
    { name: 'SideProject', sort: 'new' }, // High value for validation
    { name: 'smallbusiness', sort: 'top', time: 'week' },
    { name: 'roastmystartup', sort: 'new' },
    { name: 'GrowthHacking', sort: 'hot' },
    { name: 'indiehackers', sort: 'hot' },
    { name: 'startups', sort: 'hot' },
    { name: 'nocode', sort: 'hot' },
    { name: 'vibecoding', sort: 'hot' },
    // Additional Startup Communities
    { name: 'Entrepreneur', sort: 'hot' },
    { name: 'InternetIsBeautiful', sort: 'hot' },
    { name: 'startup', sort: 'hot' },
    { name: 'ProductHunters', sort: 'new' },
    { name: 'StartUpIndia', sort: 'hot' },
    { name: 'Startup_Ideas', sort: 'new' },
    { name: 'edtech', sort: 'hot' },
    { name: 'HealthTech', sort: 'hot' },
    { name: 'fintech', sort: 'hot' },
    { name: 'smallbusinessindia', sort: 'hot' }
];

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Modern Mobile UA for fallback (often less likely to be blocked by CDNs)
const MOBILE_SAFARI_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';

// Rotating User-Agents to appear more human and diverse
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
    MOBILE_SAFARI_UA,
    'ZerosByKai/1.0.0 (by /u/amantheshaikh)'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Session-level User-Agent to avoid triggering bot detection by changing UA mid-run
const SESSION_USER_AGENT = getRandomUserAgent();

// Export the mobile UA as the fallback source of truth
const MOBILE_UA = MOBILE_SAFARI_UA;

// Public Redlib instances for proxy fallback
const REDLIB_INSTANCES = [
    'safereddit.com',
    'redlib.perennialte.ch',
    'redlib.catsarch.com',
    'red.ngn.tf',
    'redlib.vimmer.dev'
];

// Human-like delay with variation
const humanDelay = (baseMs = 2000) => {
    const variation = Math.random() * baseMs; // 0-100% variation
    return wait(baseMs + variation);
};

// Helper to fetch valid posts from a subreddit with multi-layer fallback
async function fetchSubredditJson(subreddit, sort = 'hot', time = 'day', limit = 5, retries = 3) {
    // 1. Try Official API (if credentials exist)
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
        return fetchViaOfficialApi(subreddit, sort, time, limit);
    }

    // 2. Try Direct JSON (Multiple Subdomains)
    const jsonDomains = ['www.reddit.com', 'old.reddit.com', 'pay.reddit.com', 'it.reddit.com'];
    for (const domain of jsonDomains) {
        const posts = await tryFetchJson(domain, subreddit, sort, time, limit, retries);
        if (posts.length > 0) return posts;
        console.log(`ℹ️ JSON approach failed on ${domain}, trying next...`);
    }

    // 3. Try Direct RSS (Often unblocked for SEO bots)
    console.log(`📡 Falling back to Direct RSS for r/${subreddit}...`);
    const directRss = await tryFetchRss('www.reddit.com', subreddit, sort, time, limit);
    if (directRss.length > 0) return directRss;

    // 4. Try Redlib Proxies (Ultimate Resilience)
    console.log(`📡 Falling back to Redlib Proxies for r/${subreddit}...`);
    for (const instance of REDLIB_INSTANCES) {
        const posts = await tryFetchRss(instance, subreddit, sort, time, limit);
        if (posts.length > 0) {
            console.log(`✅ Success via Redlib proxy: ${instance}`);
            return posts;
        }
    }

    return [];
}

/**
 * Layer 2 Trace: Direct JSON Fetching
 */
async function tryFetchJson(domain, subreddit, sort, time, limit, retries) {
    const url = `https://${domain}/r/${subreddit}/${sort}.json?limit=${limit}&t=${time}&raw_json=1`;

    for (let attempt = 0; attempt < retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': attempt === 0 ? SESSION_USER_AGENT : MOBILE_UA,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/',
                    'DNT': '1'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 403) {
                console.warn(`🛑 [403] ${domain} is blocking JSON.`);
                return []; // Exit early to try next domain/layer
            }

            if (!response.ok) {
                if (attempt < retries - 1) {
                    await wait(2000 * (attempt + 1));
                    continue;
                }
                return [];
            }

            const data = await response.json();
            if (!data?.data?.children) return [];

            return data.data.children
                .filter(child => !child.data.stickied && !(child.data.title || '').toLowerCase().includes('[sticky]'))
                .map(child => ({
                    subreddit: child.data.subreddit,
                    title: child.data.title,
                    body: child.data.selftext || '',
                    url: child.data.url,
                    score: child.data.score,
                    created_utc: child.data.created_utc
                }));

        } catch (error) {
            clearTimeout(timeoutId);
            if (attempt < retries - 1) await wait(1000);
        }
    }
    return [];
}

/**
 * Layer 3/4 Trace: RSS Fetching (Direct or Proxy)
 * Note: time is unused for RSS feeds but kept for API parity with tryFetchJson
 */
async function tryFetchRss(instance, subreddit, sort, time, limit) {
    // Redlib and Reddit use slightly different URL structures for RSS but .rss usually works
    const url = `https://${instance}/r/${subreddit}/${sort}/.rss`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': MOBILE_UA,
                'Accept': 'application/xml, text/xml, */*'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (!response.ok) return [];

        const xml = await response.text();
        return parseRss(xml).slice(0, limit);

    } catch (error) {
        clearTimeout(timeoutId);
        return [];
    }
}

/**
 * Lightweight RSS Parser to avoid adding new dependencies
 */
function parseRss(xml) {
    const items = [];
    const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

    // Helper to unescape XML entities, including numeric and hex
    const decodeEntities = (str) => {
        if (!str) return '';
        // 1. Strip CDATA
        let clean = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        // 2. Decode standard entities
        clean = clean
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        // 3. Decode numeric entities (&#NNN;)
        clean = clean.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
        // 4. Decode hex entities (&#xNN;)
        clean = clean.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
        return clean;
    };

    for (const entry of entries) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
        const linkMatch = entry.match(/<link[^>]*href="([^"]*)"/);
        const updatedMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
        const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);

        const title = titleMatch ? titleMatch[1] : '';
        const content = contentMatch ? contentMatch[1] : '';
        const link = linkMatch ? linkMatch[1] : '';

        // Parse timestamp (Fall back to updated then published then now)
        const dateStr = updatedMatch?.[1] || publishedMatch?.[1];
        let timestamp = Date.now() / 1000;
        if (dateStr) {
            try {
                timestamp = new Date(dateStr).getTime() / 1000;
            } catch (e) {
                // Keep default
            }
        }

        items.push({
            title: decodeEntities(title),
            body: decodeEntities(content),
            url: link,
            subreddit: 'Reddit RSS',
            score: 0, // RSS doesn't expose score usually
            created_utc: timestamp
        });
    }
    return items;
}

export async function runRedditFlow(targetDate = new Date()) {
    console.log(`Starting Reddit Startup Ideas Workflow for date: ${targetDate.toISOString().split('T')[0]}...`);
    let allPosts = [];

    // 1. Scrape Reddit (Chunked to respect rate limits)
    const CHUNK_SIZE = 2; // Very conservative since we're unauthenticated
    for (let i = 0; i < SUBREDDITS.length; i += CHUNK_SIZE) {
        const chunk = SUBREDDITS.slice(i, i + CHUNK_SIZE);

        // Process chunk in parallel with staggered starts
        const results = await Promise.all(chunk.map(async (sub, idx) => {
            // Stagger requests within chunk (0ms, 1-3s delay)
            if (idx > 0) {
                await humanDelay(1000 + Math.random() * 2000);
            }
            console.log(`Scraping r/${sub.name} [${sub.sort}]...`);
            return fetchSubredditJson(sub.name, sub.sort, sub.time, 5);
        }));

        allPosts = [...allPosts, ...results.flat()];

        // Human-like delay between chunks (2-5 seconds)
        const chunkDelay = 2000 + Math.random() * 3000;
        console.log(`Waiting ${(chunkDelay / 1000).toFixed(1)}s before next chunk...`);
        await wait(chunkDelay);
    }

    console.log(`Total posts scraped: ${allPosts.length}`);

    // Filter for substantive posts
    const substantivePosts = allPosts.filter(p =>
        (p.body && p.body.length > 50) ||
        (p.title && p.title.length > 30)
    );

    console.log(`Substantive posts: ${substantivePosts.length}`);
    if (substantivePosts.length === 0) return;

    // 2. Process with Gemini Direct SDK
    // We want 10 ideas total. We'll do 2 AI calls with different batches of data to ensure variety.
    const shuffled = substantivePosts.sort(() => 0.5 - Math.random());
    // Limit input size to save tokens/avoid context limits
    const maxPostsPerBatch = 30;

    let validatedIdeas = [];
    const GENERATION_TARGET = 15; // Generate more to pick the best/non-duplicates
    const FINAL_LIMIT = 10;
    const MAX_WORKFLOW_RETRIES = 3;

    // Fetch existing ideas to avoid repetition
    const existingIdeas = await getExistingIdeaTitles();
    const exclusionText = existingIdeas.length > 0
        ? `\n**EXCLUSION LIST (Do NOT repeat these ideas):**\n- ${existingIdeas.join('\n- ')}`
        : "";

    // Retry entire workflow if we don't get enough ideas
    for (let workflowAttempt = 0; workflowAttempt < MAX_WORKFLOW_RETRIES; workflowAttempt++) {
        if (validatedIdeas.length >= GENERATION_TARGET) {
            console.log(`✅ Successfully generated ${validatedIdeas.length} ideas!`);
            break;
        }

        if (workflowAttempt > 0) {
            console.log(`\n🔄 Workflow retry ${workflowAttempt}/${MAX_WORKFLOW_RETRIES - 1} - Need ${GENERATION_TARGET - validatedIdeas.length} more ideas...`);
        }

        // Prepare batches for this attempt
        const batch1Posts = shuffled.slice(0, maxPostsPerBatch);
        const batch2Posts = shuffled.slice(maxPostsPerBatch, maxPostsPerBatch * 2);
        const batches = [batch1Posts, batch2Posts].filter(b => b.length > 5);

        // How many ideas do we still need?
        const ideasNeeded = GENERATION_TARGET - validatedIdeas.length;
        const ideasPerBatch = Math.ceil(ideasNeeded / batches.length);

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            if (validatedIdeas.length >= GENERATION_TARGET) break;

            const batch = batches[batchIdx];
            const promptText = `
      You are Kai, an expert opportunity analyst.
      Analyze these Reddit posts to identify recurring pain points and synthesize "Investable Opportunities" (Zeros).
      
      **Heuristics:**
      1. "Complex Hack": Spreadsheets + Zapier + Email = Opportunity.
      2. "Recurring Question": "How do I..." > 3 times = Opportunity.
      3. "Price Gap": Only Enterprise exists = Indie opportunity.
      4. "Isolation": Reducing loneliness = High value.
      
      **Input Data:**
      ${batch.map(p => `[r/${p.subreddit}] ${p.title}: ${p.body.substring(0, 200)}...`).join('\n')}

      ${exclusionText}

      **Task:**
      Generate ${ideasPerBatch} distinct, high-quality startup ideas based *only* on the problems found in this text.
      The ideas MUST be different from the EXCLUSION LIST provided above.
      
      **CRITICAL CONSTRAINT:** 
      Do NOT mention specific subreddits (e.g., "r/SaaS"), specific Reddit posts, or usernames in the output fields. Use general terms like "online communities", "founder forums", or "industry groups" instead. The output must feel platform-agnostic.
      
      **Output Format:**
      Strictly a valid JSON array of ${ideasPerBatch} objects (no markdown, no backticks):
      [
        {
          "name": "One-Word Name",
          "title": "Descriptive Title",
          "tag": "Region/Scope",
          "category": "Industry",
          "problem": "Pain point description.",
          "solution": "MVP solution.",
          "target": "Niche audience.",
          "why": "Market sizing/why now."
        }
      ]
    `;

            let retries = 3;
            let batchSuccess = false;

            while (retries > 0 && !batchSuccess) {
                try {
                    console.log(`Generating ${ideasPerBatch} ideas from batch ${batchIdx + 1}/${batches.length} (${batch.length} posts, ${retries} retries left)...`);

                    let result;
                    try {
                        // Primary Model
                        const modelPrimary = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
                        result = await modelPrimary.generateContent(promptText);
                    } catch (primaryError) {
                        console.warn("Primary model (gemini-3-flash-preview) failed:", primaryError.message);
                        console.log("Switching to backup model (gemini-2.5-flash)...");
                        // Backup Model
                        const modelBackup = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                        result = await modelBackup.generateContent(promptText);
                    }

                    const response = await result.response;
                    const text = response.text();
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

                    const ideas = JSON.parse(cleanJson);
                    if (Array.isArray(ideas) && ideas.length > 0) {
                        validatedIdeas = [...validatedIdeas, ...ideas];
                        console.log(`✅ Generated ${ideas.length} ideas (Total: ${validatedIdeas.length}/${GENERATION_TARGET})`);
                        batchSuccess = true;
                    } else {
                        throw new Error('Invalid response format or empty array');
                    }
                } catch (error) {
                    console.error(`❌ AI Generation failed (batch ${batchIdx + 1}):`, error.message);
                    retries--;

                    if (error.message.includes('429') || error.status === 429) {
                        console.log("⏳ Rate limited. Waiting 60s...");
                        await new Promise(r => setTimeout(r, 60000));
                    } else if (retries > 0) {
                        console.log(`⏳ Retrying in 5s...`);
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }

            if (!batchSuccess) {
                console.warn(`⚠️  Failed to generate ideas from batch ${batchIdx + 1} after 3 retries`);
            }
        }
    }

    // Final check
    if (validatedIdeas.length < FINAL_LIMIT) {
        console.warn(`⚠️  WARNING: Only generated ${validatedIdeas.length}/${FINAL_LIMIT} ideas after ${MAX_WORKFLOW_RETRIES} workflow attempts`);
    }

    // Final filtering stage: Ensure no repeats of existing things (Manual safety check)
    const existingTitlesSet = new Set(existingIdeas.map(t => t.toLowerCase()));
    let finalIdeas = validatedIdeas.filter(idea => {
        const fullTitle = `${idea.name}: ${idea.title}`.toLowerCase();
        return !existingTitlesSet.has(fullTitle);
    });

    // Ensure we have exactly 10 or whatever we managed to get
    finalIdeas = finalIdeas.slice(0, FINAL_LIMIT);
    console.log(`\n📊 Final result: ${finalIdeas.length} validated uniqueness ideas.`);

    // 3. Save to Database
    if (finalIdeas.length > 0) {
        const saved = await saveIdeasToDB(finalIdeas, targetDate, allPosts.length);
        if (saved) {
            await notifyAdmin(finalIdeas);
        } else {
            console.error("❌ Failed to save ideas to DB. Skipping admin notification.");
        }
    } else {
        console.log("No ideas generated.");
    }
}

async function getExistingIdeaTitles() {
    if (!supabaseAdmin) return [];
    try {
        const { data, error } = await supabaseAdmin
            .from('ideas')
            .select('title, name')
            .order('created_at', { ascending: false })
            .limit(100); // Check last 100 ideas for duplicates

        if (error) throw error;
        return data.map(i => `${i.name}: ${i.title}`);
    } catch (e) {
        console.error('⚠️ Could not fetch existing ideas for deduplication:', e.message);
        return [];
    }
}

async function saveIdeasToDB(ideas, date, postsScraped) {
    if (!supabaseAdmin) {
        console.warn('Skipping DB save: Supabase Admin client not initialized');
        return;
    }
    const today = date || new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    // Upsert weekly_batches FIRST (FK target must exist before inserting ideas)
    const { error: batchError } = await supabaseAdmin
        .from('weekly_batches')
        .upsert({
            week_start_date: weekStart,
            total_ideas: ideas.length
        }, {
            onConflict: 'week_start_date'
        });

    if (batchError) {
        console.error('Error saving batch metadata:', batchError);
        return false;
    }

    for (const idea of ideas) {
        const { error } = await supabaseAdmin
            .from('ideas')
            .insert({
                name: idea.name,
                title: idea.title || idea.name,
                problem: idea.problem,
                solution: idea.solution,
                target_audience: idea.target || idea.targetAudience,
                why_it_matters: idea.why || idea.whyItMatters,
                tags: { category: idea.category, region: idea.tag },
                week_published: weekStart,
                status: 'pending'
            });

        if (error) console.error('Error saving idea:', error);
    }

    console.log('Ideas saved to DB.');
    return true;
}

async function notifyAdmin(ideas) {
    const adminEmail = 'kai@zerosbykai.com';
    const htmlPreview = ideas.map(i => `
    <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
      <h3>${i.name}: ${i.title}</h3>
      <p><b>Problem:</b> ${i.problem}</p>
      <p><b>Solution:</b> ${i.solution}</p>
    </div>
  `).join('');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kai <kai@zerosbykai.com>',
            reply_to: 'kai@zerosbykai.com',
            to: adminEmail,
            subject: `Review Required: ${ideas.length} New Zeros Staged`,
            html: `<h1>Weekly Zeros Report</h1><p>Scraped ~20 subreddits successfully. ${ideas.length} ideas are staged as <b>pending</b>.</p><p>Review, edit, or reject ideas before <b>Monday 9 AM UTC</b> — unreviewed ideas will auto-publish.</p>${htmlPreview}`
        });

        if (error) {
            console.error('❌ Failed to send admin report email:', error);
        } else {
            console.log(`✅ Admin report sent successfully. ID: ${data.id}`);
        }
    } catch (e) {
        console.error('❌ Unexpected error sending admin report email:', e);
    }
}

// Run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    const isTestFetch = process.argv.includes('--test-fetch');

    if (isTestFetch) {
        console.log('🧪 Running in --test-fetch mode (Fetching only, no DB/Email side effects)...');
        // Test with a few representative subreddits
        const testSubs = SUBREDDITS.slice(0, 3);

        (async () => {
            for (const sub of testSubs) {
                console.log(`\n🔍 Testing r/${sub.name} [${sub.sort}]...`);
                const posts = await fetchSubredditJson(sub.name, sub.sort, sub.time, 2);
                if (posts.length > 0) {
                    console.log(`✅ Success: Found ${posts.length} posts`);
                    posts.forEach(p => console.log(`   - [${p.subreddit}] ${p.title} (${p.url})`));
                } else {
                    console.error(`❌ Failed: No posts found for r/${sub.name}`);
                }
            }
            console.log('\n✨ Test fetch completed.');
            process.exit(0);
        })();
    } else {
        console.log('Starting Reddit scraping workflow (direct execution)...');
        runRedditFlow()
            .then(() => {
                console.log('✅ Reddit flow completed successfully.');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Reddit flow failed:', error);
                process.exit(1);
            });
    }
}

/**
 * Fallback to official Reddit API if blocked
 */
async function fetchViaOfficialApi(subreddit, sort, time, limit) {
    try {
        console.log(`📡 Using official Reddit API for r/${subreddit}...`);

        // 1. Get access token (Client Credentials Flow)
        const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZerosByKai/1.0.0'
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            throw new Error(`Auth failed: ${tokenResponse.status}`);
        }

        const { access_token } = await tokenResponse.json();

        // 2. Fetch data
        const url = `https://oauth.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=${time}&raw_json=1`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'User-Agent': 'ZerosByKai/1.0.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status}`);
        }

        const data = await response.json();
        return data.data.children
            .filter(child => !child.data.stickied && !(child.data.title || '').toLowerCase().includes('[sticky]'))
            .map(child => ({
                subreddit: child.data.subreddit,
                title: child.data.title,
                body: child.data.selftext || '',
                url: child.data.url,
                score: child.data.score,
                created_utc: child.data.created_utc
            }));

    } catch (error) {
        console.error(`❌ Official API fallback failed for r/${subreddit}:`, error.message);
        return [];
    }
}

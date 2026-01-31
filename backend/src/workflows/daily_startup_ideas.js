
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
    { name: 'Startup_Ideas', sort: 'new' }
];

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch valid posts from a subreddit JSON
async function fetchSubredditJson(subreddit, sort = 'hot', time = 'day', limit = 5) {
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=${time}`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.warn(`[${response.status}] Failed to fetch r/${subreddit}`);
            return [];
        }

        const data = await response.json();
        return data.data.children.map(child => {
            const p = child.data;
            return {
                subreddit: p.subreddit,
                title: p.title,
                body: p.selftext || '',
                url: p.url,
                score: p.score,
                created_utc: p.created_utc
            };
        });
    } catch (error) {
        console.warn(`Error scraping r/${subreddit}:`, error.message);
        return [];
    }
}

export async function runRedditFlow(targetDate = new Date()) {
    console.log(`Starting Reddit Startup Ideas Workflow for date: ${targetDate.toISOString().split('T')[0]}...`);
    let allPosts = [];

    // 1. Scrape Reddit (Chunked to respect rate limits)
    const CHUNK_SIZE = 2; // Very conservative since we're unauthenticated
    for (let i = 0; i < SUBREDDITS.length; i += CHUNK_SIZE) {
        const chunk = SUBREDDITS.slice(i, i + CHUNK_SIZE);

        // Process chunk in parallel
        const results = await Promise.all(chunk.map(async (sub) => {
            // Add random jitter to avoid burst patterns
            await wait(Math.random() * 2000);
            console.log(`Scraping r/${sub.name} [${sub.sort}]...`);
            return fetchSubredditJson(sub.name, sub.sort, sub.time, 5);
        }));

        allPosts = [...allPosts, ...results.flat()];

        // Wait between chunks
        await wait(2000);
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
    const batch1Posts = shuffled.slice(0, maxPostsPerBatch);
    const batch2Posts = shuffled.slice(maxPostsPerBatch, maxPostsPerBatch * 2);

    const batches = [batch1Posts, batch2Posts].filter(b => b.length > 5);

    let validatedIdeas = [];

    for (const batch of batches) {
        const promptText = `
      You are "Bubble Lab" (aka Kai), an expert opportunity analyst.
      Analyze these Reddit posts to identify recurring pain points and synthesize "Investable Opportunities" (Zeros).
      
      **Heuristics:**
      1. "Complex Hack": Spreadsheets + Zapier + Email = Opportunity.
      2. "Recurring Question": "How do I..." > 3 times = Opportunity.
      3. "Price Gap": Only Enterprise exists = Indie opportunity.
      4. "Isolation": Reducing loneliness = High value.
      
      **Input Data:**
      ${batch.map(p => `[r/${p.subreddit}] ${p.title}: ${p.body.substring(0, 200)}...`).join('\n')}

      **Task:**
      Generate 5 distinct, high-quality startup ideas based *only* on the problems found in this text.
      
      **Output Format:**
      Strictly a valid JSON array of 5 objects (no markdown, no backticks):
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
        while (retries > 0) {
            try {
                console.log(`Generating ideas from batch of ${batch.length} posts... (Retries left: ${retries})`);

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
                if (Array.isArray(ideas)) {
                    validatedIdeas = [...validatedIdeas, ...ideas];
                }
                break; // Success, exit loop
            } catch (error) {
                console.error("AI Generation failed:", error.message);
                if (error.message.includes('429') || error.status === 429) {
                    console.log("Rate limited. Waiting 60s...");
                    await new Promise(r => setTimeout(r, 60000));
                    retries--;
                } else {
                    break; // Non-retriable error
                }
            }
        }
    }

    // Ensure we have exactly 10 or whatever we managed to get
    validatedIdeas = validatedIdeas.slice(0, 10);
    console.log(`Generated ${validatedIdeas.length} validated ideas.`);

    // 3. Save to Database
    if (validatedIdeas.length > 0) {
        await saveIdeasToDB(validatedIdeas, targetDate, allPosts.length);
        await notifyAdmin(validatedIdeas);
    } else {
        console.log("No ideas generated.");
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
    const batchId = `keyless-${Date.now()}`;

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
                status: 'pending',
                batch_id: batchId
            });

        if (error) console.error('Error saving idea:', error);
    }

    // Save posts_scraped count to weekly_batches
    if (postsScraped) {
        const { error: batchError } = await supabaseAdmin
            .from('weekly_batches')
            .upsert({
                week_start_date: weekStart,
                total_ideas: ideas.length,
                posts_scraped: postsScraped
            }, {
                onConflict: 'week_start_date'
            });

        if (batchError) console.error('Error saving batch metadata:', batchError);
    }

    console.log('Ideas saved to DB.');
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
        await resend.emails.send({
            from: 'Kai <kai@zerosbykai.com>',
            reply_to: 'kai@zerosbykai.com',
            to: adminEmail,
            subject: `Keyless Workflow: ${ideas.length} New Zeros`,
            html: `<h1>Weekly Zeros Report</h1><p>Scraped ~20 subreddits successfully.</p>${htmlPreview}`
        });
        console.log(`Admin report sent to ${adminEmail}`);
    } catch (e) {
        console.error('Failed to send email:', e);
    }
}

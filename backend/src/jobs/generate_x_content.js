/**
 * generate_x_content.js
 *
 * Generates 11 X.com post images (PNGs) + posts.csv for the week.
 * Run after weekly.js in the Monday GitHub Actions workflow.
 *
 * Read-only: only SELECT queries against Supabase. Safe to run any time.
 *
 * Outputs to backend/x_posts/ (uploaded as GitHub Actions artifact).
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env when running locally (no-op in GitHub Actions where env vars are injected)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ── Supabase (standalone — does not go through env.js to avoid critical-var checks) ──
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://zerosbykai.com').replace(/\/$/, '');
const X_POSTS_ROOT = path.join(__dirname, '../../x_posts');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// ── Load favicon as base64 once at startup ──
const FAVICON_PATH = path.join(__dirname, '../../../frontend/public/frame_5.png');
const faviconBase64 = existsSync(FAVICON_PATH)
  ? readFileSync(FAVICON_PATH).toString('base64')
  : '';

// ── Supabase helpers ──
async function getIdeasForWeek(weekStart, status = 'published') {
  const { data, error } = await supabaseAdmin
    .from('ideas')
    .select('id, name, title, problem, solution, why_it_matters, target_audience, tags')
    .eq('week_published', weekStart)
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getWinnerForWeek(weekStart) {
  const lastWeekStart = getLastMonday(new Date(weekStart));
  const { data, error } = await supabaseAdmin
    .from('weekly_batches')
    .select('winner:ideas!fk_weekly_batches_winner_idea (id, name, title, problem, solution)')
    .eq('week_start_date', lastWeekStart)
    .maybeSingle();

  if (error) throw error;
  return data?.winner || null;
}

// ── Helpers ──
function formatTags(tags) {
  if (Array.isArray(tags)) return tags;
  return [];
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns an ISO datetime string for a given posting schedule.
 * @param {string} mondayISO  "YYYY-MM-DD" — the current Monday
 * @param {number} dayOffset  0 = Monday, 1 = Tuesday, …, 9 = Wednesday+1
 * @param {number} hourEST    Hour in EST (e.g. 9.5 = 9:30 AM)
 */
function getPostDateTime(mondayISO, dayOffset, hourEST) {
  const date = new Date(`${mondayISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  const totalMinutes = Math.round(hourEST * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  // EST = UTC-5 (standard time). Adjust by +5h to convert to UTC.
  date.setUTCHours(hours + 5, mins, 0, 0);
  return date.toISOString();
}

// ── Tweet text builders ──
function buildWinnerTweet(winner) {
  return `🏆 Last week's winner is in.

The ZerosByKai community voted — and the startup idea that got the most votes this week was:

${winner.name} — ${winner.title}

The Idea:
${winner.solution}

Why:
${winner.problem}

The community saw the opportunity. Do you?

🆕 10 brand-new startup ideas just dropped today. One of them could be the next big thing.

Vote for your favourite → ${FRONTEND_URL}

#startup #buildinpublic #indiehacker #startupideas #entrepreneurship #sideproject #saas`;
}

function buildIdeaTweet(idea, index, weekDate) {
  const tags = formatTags(idea.tags).slice(0, 2);
  const tagStr = tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ');
  const whyItMatters = idea.why_it_matters || '';

  return `💡 Week of ${weekDate} — Startup Idea #${index} of the week.

${idea.name}: ${idea.title}

The Idea:
${idea.solution}

Why:
${idea.problem}

Market Potential:
${whyItMatters}

Who it's for: ${idea.target_audience || ''}

Would you build this? Vote for your favourite idea this week → ${FRONTEND_URL}

#startup ${tagStr} #buildinpublic #indiehacker #startupideas #entrepreneurship #sideproject`;
}

// ── Playwright renderer ──
async function renderCard(page, templateName, replacements, outputPath) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let html = readFileSync(templatePath, 'utf8');

  for (const [key, val] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, val);
  }

  const tempPath = outputPath.replace('.png', '_tmp.html');
  writeFileSync(tempPath, html);

  try {
    await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle' });
    const height = replacements.SCREENSHOT_HEIGHT || 1200;
    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1200, height: height } });
  } finally {
    try { unlinkSync(tempPath); } catch { }
  }
}

function buildIdeaCardReplacements(idea, index, weekDate) {
  const tags = formatTags(idea.tags).slice(0, 4);
  const tagColors = ['#67e8f9', '#fde047', '#fca5a5', '#86efac'];
  const tagsHtml = tags
    .map((t, i) => `<span class="tag" style="background:${tagColors[i]}">${escapeHtml(t.toUpperCase())}</span>`)
    .join('');

  return {
    FAVICON_BASE64: faviconBase64,
    IDEA_INDEX: String(index),
    WEEK_DATE: weekDate,
    IDEA_NAME: escapeHtml(idea.name || ''),
    IDEA_TITLE: escapeHtml(idea.title || ''),
    IDEA_PROBLEM: escapeHtml(idea.problem || ''),
    IDEA_SOLUTION: escapeHtml(idea.solution || ''),
    IDEA_MARKET: escapeHtml(idea.why_it_matters || ''),
    TAGS_HTML: tagsHtml,
  };
}

function buildWinnerCardReplacements(winner, weekStart) {
  const weekDate = new Date(weekStart + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return {
    FAVICON_BASE64: faviconBase64,
    IDEA_NAME: escapeHtml(winner.name || ''),
    IDEA_TITLE: escapeHtml(winner.title || ''),
    IDEA_PROBLEM: escapeHtml(winner.problem || ''),
    IDEA_SOLUTION: escapeHtml(winner.solution || ''),
    WEEK_DATE: weekDate,
    SCREENSHOT_HEIGHT: 600,
  };
}

// ── Markdown Gallery writer ──
function writeMarkdown(posts, outputDir) {
  let content = `# 🐦 X Post Gallery - ${posts[0]?.scheduled_date?.split(' ')[0] || ''}\n\n`;
  content += `This file provides a preview of all generated posts. You can copy-paste the text directly into X.\n\n---\n\n`;

  for (const post of posts) {
    content += `## 🕒 Scheduled: ${post.scheduled_date}\n\n`;
    content += `### 📝 Tweet Text:\n\`\`\`text\n${post.tweet_text}\n\`\`\`\n\n`;
    content += `### 🖼️ Image Preview:\n![${post.image_file}](./images/${post.image_file})\n\n`;
    content += `---\n\n`;
  }

  writeFileSync(path.join(outputDir, 'posts.md'), content, 'utf8');
}

// ── Posting schedule ──
// Day offsets from current Monday (0 = Monday, 7 = next Monday, etc.)
// Times in EST hours.
const POST_SCHEDULE = [
  { day: 0, hour: 12 }, // Monday     12:00 PM — Idea #1
  { day: 1, hour: 9 }, // Tuesday     9:00 AM — Idea #2
  { day: 2, hour: 9 }, // Wednesday   9:00 AM — Idea #3
  { day: 3, hour: 9 }, // Thursday    9:00 AM — Idea #4
  { day: 4, hour: 9 }, // Friday      9:00 AM — Idea #5
  { day: 5, hour: 10 }, // Saturday   10:00 AM — Idea #6
  { day: 6, hour: 10 }, // Sunday     10:00 AM — Idea #7
  { day: 7, hour: 8 }, // Monday+1    8:00 AM — Idea #8
  { day: 8, hour: 9 }, // Tuesday+1   9:00 AM — Idea #9
  { day: 9, hour: 9 }, // Wednesday+1 9:00 AM — Idea #10
];

// ── Main ──
async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'all'; // all | ideas | winner
  const statusArg = args.find(a => a.startsWith('--status='))?.split('=')[1] || 'published'; // published | scheduled
  const dateArg = args.find(a => a.startsWith('--date='))?.split('=')[1]; // YYYY-MM-DD

  console.log(`🐦 Starting X Content Generation [Mode: ${modeArg}, Status: ${statusArg}]...`);

  const weekStart = dateArg || getMonday();
  const OUTPUT_DIR = path.join(X_POSTS_ROOT, weekStart);
  const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

  mkdirSync(IMAGES_DIR, { recursive: true });

  const weekDate = new Date(weekStart + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const [ideas, winner] = await Promise.all([
    (modeArg === 'all' || modeArg === 'ideas') ? getIdeasForWeek(weekStart, statusArg) : Promise.resolve([]),
    (modeArg === 'all' || modeArg === 'winner') ? getWinnerForWeek(weekStart) : Promise.resolve(null)
  ]);

  if (ideas.length > 0) console.log(`📋 Found ${ideas.length} ${statusArg} idea(s) for week ${weekStart}`);
  if (winner) console.log(`🏆 Winner: ${winner.name}`);

  const posts = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1200 });

  try {
    // 1. Winner card (Monday 09:30 AM EST)
    if (winner && (modeArg === 'all' || modeArg === 'winner')) {
      const imageFile = 'images/00-winner.png';
      await renderCard(
        page,
        'x-card-winner.html',
        buildWinnerCardReplacements(winner, weekStart),
        path.join(OUTPUT_DIR, imageFile)
      );
      posts.push({
        scheduled_date: getPostDateTime(weekStart, 0, 9.5),
        tweet_text: buildWinnerTweet(winner),
        image_file: imageFile,
        posted: 'FALSE',
      });
      console.log('✅ Winner card generated');
    }

    // 2. Idea cards
    if (modeArg === 'all' || modeArg === 'ideas') {
      for (let i = 0; i < Math.min(ideas.length, 10); i++) {
        const idea = ideas[i];
        const { day, hour } = POST_SCHEDULE[i];
        const imageFile = `images/${String(i + 1).padStart(2, '0')}-idea.png`;

        await renderCard(
          page,
          'x-card-idea.html',
          buildIdeaCardReplacements(idea, i + 1, weekDate),
          path.join(OUTPUT_DIR, imageFile)
        );
        posts.push({
          scheduled_date: getPostDateTime(weekStart, day, hour),
          tweet_text: buildIdeaTweet(idea, i + 1, weekDate),
          image_file: imageFile,
          posted: 'FALSE',
        });
        console.log(`✅ Idea #${i + 1} card generated: ${idea.name}`);
      }
    }
  } finally {
    await browser.close();
  }

  // 3. Final Gallery Metadata Refresh
  // We re-fetch both scheduled and published ideas to ensure posts.md is ALWAYS a full weekly overview,
  // even if we only just generated one of the items.
  const [finalIdeas, finalWinner] = await Promise.all([
    getIdeasForWeek(weekStart, 'published'),
    getWinnerForWeek(weekStart),
    // Also check scheduled in case we are in the middle of a week
    getIdeasForWeek(weekStart, 'scheduled')
  ]);

  // Combine published and scheduled ideas (deduplicate)
  const combinedIdeasMap = new Map();
  // We prefer published over scheduled if IDs match
  [...arguments[2] || [], ...finalIdeas].forEach(i => combinedIdeasMap.set(i.id, i));
  const galleryIdeas = Array.from(combinedIdeasMap.values()).slice(0, 10);

  const galleryPosts = [];
  if (finalWinner) {
    galleryPosts.push({
      scheduled_date: getPostDateTime(weekStart, 0, 9.5),
      tweet_text: buildWinnerTweet(finalWinner),
      image_file: '00-winner.png'
    });
  }

  galleryIdeas.forEach((idea, i) => {
    const { day, hour } = POST_SCHEDULE[i];
    galleryPosts.push({
      scheduled_date: getPostDateTime(weekStart, day, hour),
      tweet_text: buildIdeaTweet(idea, i + 1, weekDate),
      image_file: `${String(i + 1).padStart(2, '0')}-idea.png`
    });
  });

  if (galleryPosts.length > 0) {
    writeMarkdown(galleryPosts, OUTPUT_DIR);
  }

  console.log(`📄 posts.md updated with ${galleryPosts.length} total post(s)`);
  console.log(`✅ X Content Generation complete → ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('❌ X Content Generation failed:', err);
  process.exit(1);
});

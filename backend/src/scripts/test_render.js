import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const LOGO_PATH = path.join(__dirname, '../../../frontend/public/frame_5.png');
const OUTPUT_DIR = path.join(__dirname, '../../test_images');

mkdirSync(OUTPUT_DIR, { recursive: true });

const logoBase64 = existsSync(LOGO_PATH)
    ? readFileSync(LOGO_PATH).toString('base64')
    : '';

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

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
        await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1200, height: 1200 } });
    } finally {
        try { unlinkSync(tempPath); } catch { }
    }
}

async function main() {
    console.log('🚀 Starting Test Render...');

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 1200 });

    try {
        // 1. Idea Card Test
        console.log('Generating sample Idea card...');
        const ideaReplacements = {
            FAVICON_BASE64: logoBase64,
            IDEA_INDEX: '1',
            WEEK_DATE: 'FEB 26, 2026',
            IDEA_NAME: 'AI CAFFEINE',
            IDEA_TITLE: 'PERSONALIZED ENERGY MANAGEMENT',
            IDEA_SOLUTION: 'An AI-powered app that tracks your sleep and biological clock to tell you exactly when to drink coffee for maximum focus without crashing.',
            IDEA_PROBLEM: 'Most people consume caffeine at the wrong times, leading to jitters in the afternoon and poor sleep at night.',
            IDEA_MARKET: '450 million daily coffee drinkers who care about productivity and biohacking.',
            TAGS_HTML: '<span class="tag" style="background:#67e8f9">WELLNESS</span><span class="tag" style="background:#fde047">AI</span>'
        };

        await renderCard(page, 'x-card-idea.html', ideaReplacements, path.join(OUTPUT_DIR, 'sample-idea.png'));

        // 2. Winner Card Test
        console.log('Generating sample Winner card...');
        const winnerReplacements = {
            FAVICON_BASE64: logoBase64,
            IDEA_NAME: 'MICRO-SAAS FACTORY',
            IDEA_TITLE: 'AUTOMATED COMPONENT GENERATOR',
            IDEA_PROBLEM: 'Developers spend 40% of their time writing boilerplate UI code.',
            IDEA_SOLUTION: 'A tool that generates production-ready React components from simple hand-drawn sketches in seconds.',
            WEEK_DATE: 'FEB 19, 2026'
        };

        await renderCard(page, 'x-card-winner.html', winnerReplacements, path.join(OUTPUT_DIR, 'sample-winner.png'));

        console.log(`✅ Test rendering complete! Images saved to: ${OUTPUT_DIR}`);
    } catch (err) {
        console.error('❌ Test render failed:', err);
    } finally {
        await browser.close();
    }
}

main();

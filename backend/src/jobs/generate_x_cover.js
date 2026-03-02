/**
 * generate_x_cover.js
 *
 * Generates the X.com profile cover photo (1500×500px).
 * Outputs to backend/x_posts/cover/x-cover.png
 *
 * Usage: node src/jobs/generate_x_cover.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, unlinkSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const X_POSTS_ROOT  = path.join(__dirname, '../../x_posts');
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const FAVICON_PATH  = path.join(__dirname, '../../../frontend/public/favicon-32x32.png');
const KAI_IMG_PATH  = path.join(__dirname, '../../../frontend/public/kai-hero.jpg');

const faviconBase64  = existsSync(FAVICON_PATH) ? readFileSync(FAVICON_PATH).toString('base64') : '';
const kaiImageBase64 = existsSync(KAI_IMG_PATH)  ? readFileSync(KAI_IMG_PATH).toString('base64')  : '';

async function main() {
  console.log('🖼  Generating X cover photo...');

  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1500, height: 500 });

  let html = readFileSync(path.join(TEMPLATES_DIR, 'x-cover.html'), 'utf8');
  html = html.replaceAll('{{FAVICON_BASE64}}',  faviconBase64);
  html = html.replaceAll('{{KAI_IMAGE_BASE64}}', kaiImageBase64);

  const outputDir = path.join(X_POSTS_ROOT, 'cover');
  mkdirSync(outputDir, { recursive: true });

  const tempPath   = path.join(outputDir, '_tmp_cover.html');
  const outputPath = path.join(outputDir, 'x-cover.png');

  writeFileSync(tempPath, html);

  try {
    await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1500, height: 500 } });
  } finally {
    try { unlinkSync(tempPath); } catch {}
  }

  await browser.close();
  console.log(`✅ Cover generated → ${outputPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });

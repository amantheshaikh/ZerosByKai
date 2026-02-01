import { runRedditFlow } from '../workflows/daily_startup_ideas.js';

console.log('Starting Reddit scraping workflow (GitHub Actions runner)...');

try {
  await runRedditFlow();
  console.log('Reddit flow completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Reddit flow failed:', error);
  process.exit(1);
}

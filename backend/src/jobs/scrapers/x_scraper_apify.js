import { ApifyClient } from 'apify-client';
import { config } from '../../config/env.js';

export async function scrapeX() {
    console.log('Scraping X (Twitter) via Apify...');

    if (!config.apify.token) {
        console.warn('⚠️ No APIFY_API_TOKEN found. Skipping X scraping.');
        return [];
    }

    try {
        const client = new ApifyClient({
            token: config.apify.token,
        });

        // Queries similar to before
        const queries = [
            '"I hate" "software" -filter:links lang:en -filter:replies',
            '"I wish there was an app" -filter:links lang:en -filter:replies',
            '"someone please build" -filter:links lang:en -filter:replies',
            '"I would pay for" -filter:links lang:en -filter:replies'
        ];

        // Pick 1 random query to save credits (Apify isn't free forever)
        const selectedQuery = queries[Math.floor(Math.random() * queries.length)];
        console.log(`Using query: ${selectedQuery}`);

        // ACTOR: apidojo/tweet-scraper is very popular and reliable.
        // Input parameters depend on the specific actor.
        const runInput = {
            "customMapFunction": "(object) => { return {...object} }",
            "maxItems": 15,
            "onlyImage": false,
            "onlyQuote": false,
            "onlyTwitterBlue": false,
            "onlyVideo": false,
            "onlyVerifiedUsers": false,
            "searchMode": "live", // "live" = Latest, "top" = Top
            "searchTerms": [selectedQuery],
            "sort": "Latest"
        };

        // Start execution
        // Note: 'apidojo/tweet-scraper' might change, 'curious_coder/twitter-scraper' is another.
        // Let's use 'apidojo/tweet-scraper' as planned.
        const run = await client.actor("apidojo/tweet-scraper").call(runInput);

        // Fetch results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);

        return items
            .filter(item => {
                // Freshness check (if actor returns 'createdAt' or 'created_at')
                const dateStr = item.createdAt || item.created_at;
                if (!dateStr) return true; // keep if unknown
                const date = new Date(dateStr).getTime();
                return date > fifteenDaysAgo;
            })
            .map(item => ({
                source: 'x',
                author: item.user?.screen_name || item.userName || 'unknown',
                title: `Tweet by ${item.user?.screen_name || item.userName || 'unknown'}`,
                body: item.text || item.fullText || '',
                url: item.url || item.twitterUrl || `https://x.com/${item.user?.screen_name}/status/${item.id}`,
                score: item.likeCount || item.favorite_count || 0
            }));

    } catch (error) {
        console.error('Apify X Scraping failed:', error.message);
        return [];
    }
}

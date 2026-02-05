import { algoliasearch } from 'algoliasearch';

// Credentials extracted from env
const APP_ID = process.env.IH_APP_ID;
const API_KEY = process.env.IH_API_KEY;
const INDEX_NAME = process.env.IH_INDEX_NAME || 'discussions';

export async function scrapeIndieHackers() {
    console.log('Scraping Indie Hackers (Algolia)...');

    if (!APP_ID || !API_KEY) {
        console.error('❌ Missing Indie Hackers Algolia credentials (IH_APP_ID, IH_API_KEY). Skipping.');
        return [];
    }

    try {
        const client = algoliasearch(APP_ID, API_KEY);

        // We want to find discussions about problems or validation.
        // We can search for multiple keywords.
        const queries = ['problem', 'pain', 'idea', 'validation', 'hate', 'stuck'];
        // Pick 2 random queries to vary results
        const keywords = queries.sort(() => 0.5 - Math.random()).slice(0, 2);

        const fifteenDaysAgoMs = Date.now() - (15 * 24 * 60 * 60 * 1000);

        const requests = keywords.map(q => ({
            indexName: INDEX_NAME,
            query: q,
            hitsPerPage: 10,
            numericFilters: [`createdTimestamp > ${fifteenDaysAgoMs}`]
        }));

        const response = await client.search({ requests });

        let allHits = [];
        response.results.forEach(result => {
            if (result.hits) {
                allHits = [...allHits, ...result.hits];
            }
        });

        // Deduplicate by objectID
        const seen = new Set();
        const uniqueHits = allHits.filter(hit => {
            if (seen.has(hit.objectID)) return false;
            seen.add(hit.objectID);
            return true;
        });

        return uniqueHits.map(hit => ({
            source: 'indie_hackers',
            title: hit.title || 'Untitled',
            body: hit.body || '',
            url: `https://www.indiehackers.com/post/${hit.objectID}`, // URL structure assumption
            score: hit.numUpvotes || 0,
            author: hit.username || 'Unknown'
        }));

    } catch (error) {
        console.error('Error scraping Indie Hackers:', error.message);
        return [];
    }
}

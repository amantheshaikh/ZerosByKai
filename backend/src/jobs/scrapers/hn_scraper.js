// HN uses its own official Firebase API. No Reddit logic needed here.

export async function scrapeHackerNews() {
    console.log('Scraping Hacker News...');
    try {
        // Fetch top stories from Ask HN
        // Using the official HN Firebase API
        // Check for 2xx response
        const response = await fetch('https://hacker-news.firebaseio.com/v0/askstories.json');
        if (!response.ok) throw new Error(`Failed to fetch stories list: ${response.statusText}`);
        const storyIds = await response.json();

        // Take the top 60 IDs (depth to find fresh content)
        const topIds = storyIds.slice(0, 60);

        // Use allSettled for robustness
        const results = await Promise.allSettled(
            topIds.map(id =>
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                    .then(r => {
                        if (!r.ok) throw new Error(`Failed to fetch item ${id}`);
                        return r.json();
                    })
            )
        );

        // Filter only successful fetches
        const stories = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        if (results.some(r => r.status === 'rejected')) {
            console.warn(`[HN] ${results.filter(r => r.status === 'rejected').length} items failed to load.`);
        }

        const fifteenDaysAgo = Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60);

        // Filter for "problem" related keywords AND freshness
        const problemKeywords = ['problem', 'hate', 'wish', 'idea', 'pain', 'solution', 'tool', 'software', 'app', 'stuck'];

        const filtered = stories.filter(story => {
            if (!story || !story.title) return false;

            // Freshness check
            if (story.time < fifteenDaysAgo) return false;

            const lowerTitle = story.title.toLowerCase();
            const text = (lowerTitle + ' ' + (story.text || '')).toLowerCase();

            // Filter out "Who is hiring" posts (case insensitive)
            if (lowerTitle.includes('who is hiring')) return false;

            // Check if it matches our keywords
            return problemKeywords.some(kw => text.includes(kw));
        });

        return filtered.map(story => ({
            source: 'hacker_news',
            id: story.id,
            title: story.title,
            body: story.text || '', // HTML content often
            url: `https://news.ycombinator.com/item?id=${story.id}`,
            score: story.score,
            comments: story.descendants
        }));

    } catch (error) {
        console.error('Error scraping Hacker News:', error);
        return [];
    }
}

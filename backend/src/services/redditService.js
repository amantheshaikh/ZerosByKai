/**
 * Reddit Fetching Service
 * Responsible for retrieving posts and comments with multi-layer fallback logic.
 */

// Modern Mobile UA for fallback
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';

// Rotating User-Agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'ZerosByKai/1.0.0 (by /u/amantheshaikh)'
];

const SESSION_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const REDLIB_INSTANCES = [
    'safereddit.com',
    'redlib.perennialte.ch',
    'redlib.catsarch.com',
    'red.ngn.tf',
    'redlib.vimmer.dev'
];

let redditTokenCache = {
    token: null,
    expiresAt: 0
};

/**
 * Fetch a new OAuth token from Reddit
 */
async function getAuthToken(config) {
    const now = Date.now();
    if (redditTokenCache.token && now < redditTokenCache.expiresAt) {
        return redditTokenCache.token;
    }

    try {
        const auth = Buffer.from(`${config.reddit.clientId}:${config.reddit.clientSecret}`).toString('base64');
        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZerosByKai/1.0.0'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) return null;

        const data = await response.json();
        redditTokenCache.token = data.access_token;
        redditTokenCache.expiresAt = now + (data.expires_in - 300) * 1000;
        return redditTokenCache.token;
    } catch (error) {
        return null;
    }
}

/**
 * Fetch from official API
 */
async function fetchOfficial(subreddit, sort, time, limit, config) {
    const token = await getAuthToken(config);
    if (!token) return [];

    try {
        const url = `https://oauth.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=${time}&raw_json=1`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'ZerosByKai/1.0.0'
            }
        });

        if (!response.ok) return [];
        const data = await response.json();
        return (data.data.children || []).map(c => normalizePost(c.data, c.kind));
    } catch (e) {
        return [];
    }
}

/**
 * Fetch from JSON endpoints
 */
async function fetchJson(subreddit, sort, time, limit) {
    const jsonDomains = ['www.reddit.com', 'old.reddit.com', 'pay.reddit.com'];
    for (const domain of jsonDomains) {
        try {
            const url = `https://${domain}/r/${subreddit}/${sort}.json?limit=${limit}&t=${time}&raw_json=1`;
            const response = await fetch(url, {
                headers: { 'User-Agent': SESSION_UA }
            });
            if (response.ok) {
                const data = await response.json();
                return (data.data.children || []).map(c => normalizePost(c.data, c.kind));
            }
        } catch (e) { }
    }
    return [];
}

/**
 * Fetch from RSS (Redlib or Reddit)
 */
async function fetchRss(subreddit, sort, limit, instance = 'www.reddit.com') {
    try {
        const url = `https://${instance}/r/${subreddit}/${sort}/.rss`;
        const response = await fetch(url, {
            headers: { 'User-Agent': MOBILE_UA }
        });
        if (!response.ok) return [];
        const xml = await response.text();
        return parseRss(xml).slice(0, limit);
    } catch (e) {
        return [];
    }
}

function normalizePost(d, kind) {
    return {
        subreddit: d.subreddit,
        title: d.link_title || d.title,
        body: d.body || d.selftext || '',
        url: d.permalink ? `https://reddit.com${d.permalink}` : d.url,
        score: d.score,
        created_utc: d.created_utc,
        is_comment: kind === 't1' || !!d.body
    };
}

function parseRss(xml) {
    const items = [];
    const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

    const decode = (str) => str?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'") || '';

    for (const entry of entries) {
        const title = decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
        const content = decode(entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]);
        const link = entry.match(/<link[^>]*href="([^"]*)"/)?.[1];

        items.push({
            subreddit: 'Reddit RSS',
            title: title || 'Reddit Post',
            body: content.replace(/&lt;[^&>]+&gt;/g, ' ').substring(0, 1000),
            url: link,
            score: 0,
            created_utc: Date.now() / 1000,
            is_comment: (title || '').includes(' on ')
        });
    }
    return items;
}

/**
 * Main entry point for fetching data for a subreddit
 */
export async function fetchSubreddit(subreddit, sort = 'hot', time = 'day', limit = 10, config) {
    // 1. Official API
    if (config.reddit.clientId && config.reddit.clientSecret) {
        const official = await fetchOfficial(subreddit, sort, time, limit, config);
        if (official.length > 0) return official;
    }

    // 2. Direct JSON
    const json = await fetchJson(subreddit, sort, time, limit);
    if (json.length > 0) return json;

    // 3. RSS
    const rss = await fetchRss(subreddit, sort, limit);
    if (rss.length > 0) return rss;

    // 4. Redlib Proxies
    for (const instance of REDLIB_INSTANCES) {
        const redlib = await fetchRss(subreddit, sort, limit, instance);
        if (redlib.length > 0) return redlib;
    }

    return [];
}

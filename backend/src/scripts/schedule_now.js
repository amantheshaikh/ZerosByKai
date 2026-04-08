import { pickAndPublishIdeas } from '../services/newsletterService.js';

async function main() {
    try {
        const published = await pickAndPublishIdeas();
        console.log(`Successfully scheduled ${published.length} ideas.`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to schedule ideas:', error);
        process.exit(1);
    }
}

main();

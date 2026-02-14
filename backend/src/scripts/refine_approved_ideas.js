import { supabaseAdmin } from '../config/supabase.js';
import { AIService } from '../services/aiService.js';
import { config } from '../config/env.js';

/**
 * Refine Approved Ideas Script
 * Usage:
 *   node src/scripts/refine_approved_ideas.js [--dry-run]
 */

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    const weekIdx = process.argv.indexOf('--week');
    const weekFilter = weekIdx !== -1 ? process.argv[weekIdx + 1] : null;

    console.log(`🚀 Starting refinement of ideas... ${isDryRun ? '[DRY RUN]' : ''}`);
    if (weekFilter) console.log(`📅 Target Week: ${weekFilter}`);

    try {
        // 1. Fetch ideas to refine
        let query = supabaseAdmin.from('ideas').select('*');

        if (weekFilter) {
            query = query.eq('week_published', weekFilter).eq('status', 'scheduled');
        } else {
            query = query.eq('status', 'approved');
        }

        const { data: ideas, error } = await query;

        if (error) throw error;

        if (!ideas || ideas.length === 0) {
            console.log('✅ No approved ideas found to refine.');
            process.exit(0);
        }

        console.log(`📡 Found ${ideas.length} ideas to refine.`);

        // 2. Initialize AI Service
        const aiService = new AIService(config);

        // 3. Process in batches
        const BATCH_SIZE = 5;
        let successCount = 0;

        for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
            const batch = ideas.slice(i, i + BATCH_SIZE);
            console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ideas.length / BATCH_SIZE)}...`);

            try {
                const refinedBatch = await aiService.refineExistingIdeas(batch);

                for (const refinedIdea of refinedBatch) {
                    if (isDryRun) {
                        console.log(`\n--- [DRY RUN] Refined: ${refinedIdea.name} ---`);
                        console.log(`Title: ${refinedIdea.title}`);
                        console.log(`Problem: ${refinedIdea.problem}`);
                        console.log(`Tags: ${refinedIdea.tags.join(', ')}`);
                    } else {
                        const { error: updateError } = await supabaseAdmin
                            .from('ideas')
                            .update({
                                name: refinedIdea.name,
                                title: refinedIdea.title,
                                problem: refinedIdea.problem,
                                solution: refinedIdea.solution,
                                target_audience: refinedIdea.target_audience,
                                tags: refinedIdea.tags
                            })
                            .eq('id', refinedIdea.id);

                        if (updateError) {
                            console.error(`❌ Failed to update idea ${refinedIdea.id}:`, updateError.message);
                        } else {
                            console.log(`✅ Updated: ${refinedIdea.name}`);
                            successCount++;
                        }
                    }
                }
            } catch (batchError) {
                console.error(`❌ Batch failed:`, batchError.message);
            }
        }

        console.log(`\n🏁 Done! ${isDryRun ? 'Dry run finished.' : `Successfully refined ${successCount} ideas.`}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();

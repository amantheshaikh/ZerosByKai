import { config } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AIService } from '../services/aiService.js';
import { getMonday } from '../utils/dateUtils.js';

const aiService = new AIService(config);

/**
 * Refine the ideas for a specific week and generate a subject line.
 * Defaults to the current week (this Monday).
 */
async function refineWeeklyBatch(targetDate = null) {
    try {
        const weekStart = targetDate ? getMonday(targetDate) : getMonday();
        console.log(`📡 Refining batch for week ${weekStart}...`);

        // 1. Fetch the 10 ideas for this week
        const { data: ideas, error: fetchError } = await supabaseAdmin
            .from('ideas')
            .select('*')
            .eq('week_published', weekStart)
            .limit(10);

        if (fetchError) throw fetchError;
        if (!ideas || ideas.length === 0) {
            console.error(`❌ No ideas found scheduled for week ${weekStart}`);
            return;
        }

        console.log(`🔍 Found ${ideas.length} ideas. Refining...`);

        // 2. Refine ideas via AI
        const refined = await aiService.refineExistingIdeas(ideas);

        // 3. Update ideas in DB
        for (const idea of refined) {
            const { error: updateError } = await supabaseAdmin
                .from('ideas')
                .update({
                    name: idea.name,
                    title: idea.title,
                    problem: idea.problem,
                    solution: idea.solution,
                    target_audience: idea.target_audience,
                    tags: idea.tags,
                    why_it_matters: idea.why_it_matters
                })
                .eq('id', idea.id);
            
            if (updateError) {
                console.error(`❌ Error updating idea ${idea.id}:`, updateError.message);
            } else {
                console.log(`✅ Updated: ${idea.name}`);
            }
        }

        // 4. Generate and update subject line
        console.log(`📧 Generating subject line...`);
        const subject = await aiService.generateNewsletterSubject(refined);

        const { error: batchError } = await supabaseAdmin
            .from('weekly_batches')
            .update({ subject_line: subject })
            .eq('week_start_date', weekStart);

        if (batchError) {
            console.error(`❌ Error updating batch subject line:`, batchError.message);
        } else {
            console.log(`✅ Subject Line set: "${subject}"`);
        }

        console.log(`\n🎉 Refinement complete for week ${weekStart}`);
    } catch (error) {
        console.error(`❌ Critical failure:`, error.message);
        process.exit(1);
    }
}

// Execute
const target = process.argv[2] || null;
refineWeeklyBatch(target);

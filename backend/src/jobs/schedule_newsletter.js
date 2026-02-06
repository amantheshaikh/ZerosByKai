
import { pickAndPublishIdeas } from '../services/newsletterService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AIService } from '../services/aiService.js';
import { config } from '../config/env.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';

/**
 * Schedule Newsletter Script
 * Usage: 
 *   node src/jobs/schedule_newsletter.js --weeks 1  (Schedules next week)
 *   node src/jobs/schedule_newsletter.js --date 2024-02-19 (Schedules specific week)
 */

export async function scheduleNewsletter() {
    try {
        // Parse args
        const args = process.argv.slice(2);
        let targetDate = null;

        if (args.includes('--weeks')) {
            const weeksIdx = args.indexOf('--weeks');
            const weeksToAdd = parseInt(args[weeksIdx + 1], 10);
            if (isNaN(weeksToAdd)) throw new Error('Invalid --weeks value');

            const today = new Date();
            targetDate = new Date(today.getTime() + (weeksToAdd * 7 * 24 * 60 * 60 * 1000));
        } else if (args.includes('--date')) {
            const dateIdx = args.indexOf('--date');
            targetDate = new Date(args[dateIdx + 1]);
            if (isNaN(targetDate.getTime())) throw new Error('Invalid --date value');
        } else {
            console.log('Usage: node schedule_newsletter.js --weeks <N> OR --date <YYYY-MM-DD>');
            process.exit(1);
        }

        const weekStart = getMonday(targetDate);
        console.log(`\n📅 Scheduling Newsletter for Week: ${weekStart}`);
        console.log('------------------------------------------------');

        // 1. Pick and Publish Ideas (Create Batch)
        // This will create the batch row if missing and populate it with ideas.
        let ideas = await pickAndPublishIdeas(targetDate);

        // If workflow skipped (returns batch object), fetch ideas manually
        if (ideas && !Array.isArray(ideas)) {
            console.log('ℹ️  Batch already exists. Fetching associated ideas...');
            const { data: fetchedIdeas } = await supabaseAdmin
                .from('ideas')
                .select('*')
                .eq('week_published', weekStart)
                .eq('status', 'published');
            ideas = fetchedIdeas;
        }

        if (!ideas || ideas.length === 0) {
            console.error('❌ Failed to pick 10 ideas. Check backlog size.');
            process.exit(1);
        }

        // 2. Fetch or Generate Subject Line
        // We need the batch ID to save the subject
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('weekly_batches')
            .select('*')
            .eq('week_start_date', weekStart)
            .single();

        if (batchError) throw batchError;

        if (batch.subject_line) {
            console.log(`ℹ️  Subject line already exists: "${batch.subject_line}"`);
            console.log('   (To regenerate, update DB manually or add --force flag in future)');
        } else {
            console.log('🤖 Generating AI Subject Line...');

            // Get last week's winner for context
            const lastWeekStart = getLastMonday(new Date(weekStart));
            const { data: lastWeekBatch } = await supabaseAdmin
                .from('weekly_batches')
                .select(`
                    *,
                    winner:ideas!fk_weekly_batches_winner_idea (*)
                `)
                .eq('week_start_date', lastWeekStart)
                .maybeSingle();

            const aiService = new AIService(config);
            const dynamicSubject = await aiService.generateNewsletterSubject(ideas, lastWeekBatch?.winner);

            if (dynamicSubject) {
                console.log(`✨ Generated Subject: "${dynamicSubject}"`);

                // Save to DB
                const { error: saveError } = await supabaseAdmin
                    .from('weekly_batches')
                    .update({ subject_line: dynamicSubject })
                    .eq('id', batch.id);

                if (saveError) throw saveError;
                console.log('✅ Subject Line Saved!');
            } else {
                console.error('❌ Failed to generate subject line.');
            }
        }

        console.log('\n✅ Scheduling Complete!');
        console.log(`   Week: ${weekStart}`);
        console.log(`   Ideas: ${ideas.length}`);
        console.log(`   Subject: ${batch.subject_line || 'Generated (Seen above)'}`);
        console.log('------------------------------------------------');
        process.exit(0);

    } catch (error) {
        console.error('Error scheduling newsletter:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    scheduleNewsletter();
}

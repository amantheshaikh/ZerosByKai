import { supabaseAdmin } from '../config/supabase.js';
import { getMonday } from '../utils/dateUtils.js';

/**
 * Pull-based Publishing: Selects 10 opportunities from the backlog and 
 * assigns them to the current week.
 * @param {Date|string} targetDate - Optional date to target (defaults to current Monday)
 */
export async function pickAndPublishIdeas(targetDate = null) {
    try {
        const weekStart = targetDate ? getMonday(targetDate) : getMonday();

        console.log(`📡 Picking 10 opportunities from backlog for week ${weekStart}...`);

        // Step 0: Ensure Weekly Batch Exists (Publisher Log)
        // We treat 'weekly_batches' as the log of what WAS published, not an input requirement.
        let { data: currentBatch, error: batchError } = await supabaseAdmin
            .from('weekly_batches')
            .select('*')
            .eq('week_start_date', weekStart)
            .maybeSingle();

        if (batchError) console.error('Error fetching batch:', batchError);

        // Double-run protection: If batch exists AND has ideas, we are done.
        if (currentBatch?.total_ideas > 0) {
            console.log(`⚠️  Workflow skipped: ${currentBatch.total_ideas} opportunities already published for week ${weekStart}.`);
            return currentBatch; // Return existing batch context
        }

        // If no batch exists, create one now
        if (!currentBatch) {
            console.log(`🆕 Creating new weekly batch for ${weekStart}...`);
            const { data: newBatch, error: createError } = await supabaseAdmin
                .from('weekly_batches')
                .insert({ week_start_date: weekStart, total_ideas: 0 })
                .select()
                .single();

            if (createError) throw new Error(`Failed to create batch: ${createError.message}`);
            currentBatch = newBatch;
        }

        // Step 1: Select 10 oldest approved ideas (FIFO)
        console.log('🔍 Picking 10 opportunities from Approved list...');
        const { data: backlogIdeas, error: fetchError } = await supabaseAdmin
            .from('ideas')
            .select('id, name')
            .eq('status', 'approved')
            .order('created_at', { ascending: true }) // FIFO: Oldest first
            .limit(10);

        if (fetchError) throw fetchError;

        if (!backlogIdeas || backlogIdeas.length < 10) {
            // Strict validation: Must have exactly 10 approved ideas
            const available = backlogIdeas?.length || 0;
            throw new Error(
                `Cannot schedule newsletter: Only ${available} approved ideas found (need 10). ` +
                `Please approve at least 10 ideas in Supabase before scheduling.`
            );
        }

        // Step 2: Publish them (Atomic-ish)
        // We update them to 'published' and link to this week
        const ideaIds = backlogIdeas.map(i => i.id);
        const { data: published, error: updateError } = await supabaseAdmin
            .from('ideas')
            .update({
                status: 'scheduled',
                week_published: weekStart
            })
            .in('id', ideaIds)
            .select();

        if (updateError) throw new Error(`Failed to publish ideas: ${updateError.message}`);

        // Step 3: Update Batch Metrics
        const { error: finalBatchError } = await supabaseAdmin
            .from('weekly_batches')
            .update({ total_ideas: backlogIdeas.length })
            .eq('id', currentBatch.id);

        if (finalBatchError) console.error('Error updating batch metrics:', finalBatchError);

        console.log(`✅ Successfully published ${backlogIdeas.length} opportunities for week ${weekStart}`);
        return published;
    } catch (error) {
        console.error('Error in pickAndPublishIdeas:', error);
        throw error;
    }
}

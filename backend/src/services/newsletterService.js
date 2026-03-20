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

        // Step 1 & 2: Select 10 oldest approved ideas and schedule them (ATOMIC)
        console.log('🔍 Atomically picking and scheduling 10 opportunities from Approved list...');
        let published;
        
        try {
            const { data, error: rpcError } = await supabaseAdmin
                .rpc('pick_and_schedule_ideas', { p_week: weekStart });
            
            if (rpcError) throw rpcError;
            published = data;
        } catch (rpcError) {
            if (rpcError.message?.includes('Could not find the function') || rpcError.code === 'PGRST202') {
                console.warn('⚠️  RPC pick_and_schedule_ideas missing. Falling back to manual scheduling...');
                
                // Manual Fallback: Fetch 10 oldest approved ideas
                const { data: approved, error: fetchError } = await supabaseAdmin
                    .from('ideas')
                    .select('id')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: true })
                    .limit(10);

                if (fetchError) throw fetchError;
                if (!approved || approved.length < 10) {
                    throw new Error(`Not enough approved ideas found (need 10, found ${approved?.length || 0})`);
                }

                const ids = approved.map(i => i.id);

                // Update their status and week
                const { data: updated, error: updateError } = await supabaseAdmin
                    .from('ideas')
                    .update({ status: 'scheduled', week_published: weekStart })
                    .in('id', ids)
                    .select();

                if (updateError) throw updateError;
                published = updated;
            } else {
                throw rpcError;
            }
        }

        if (!published || published.length < 10) {
            throw new Error(`Scheduled ${published?.length || 0} ideas which is less than 10.`);
        }

        // Step 3: Update Batch Metrics
        const { error: finalBatchError } = await supabaseAdmin
            .from('weekly_batches')
            .update({ total_ideas: published.length })
            .eq('id', currentBatch.id);

        if (finalBatchError) console.error('Error updating batch metrics:', finalBatchError);

        console.log(`✅ Successfully scheduled ${published.length} opportunities for week ${weekStart}`);
        return published;
    } catch (error) {
        console.error('Error in pickAndPublishIdeas:', error);
        throw error;
    }
}

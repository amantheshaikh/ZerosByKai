
import { supabaseAdmin } from './src/config/supabase.js';

async function checkBatch(date) {
    console.log(`Checking database state for week: ${date}...`);

    try {
        // Check ideas count for this week
        const { count, error: countError } = await supabaseAdmin
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('week_published', date);

        if (countError) throw countError;
        console.log(`Ideas remaining for ${date}: ${count}`);

        // Check batch exists
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('weekly_batches')
            .select('*')
            .eq('week_start_date', date)
            .single();

        if (batchError && batchError.code !== 'PGRST116') throw batchError;

        if (batch) {
            console.log('Weekly batch record found:');
            console.log(JSON.stringify(batch, null, 2));
        } else {
            console.log('Weekly batch record NOT found.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

const date = process.argv[2] || '2026-02-02';
checkBatch(date);

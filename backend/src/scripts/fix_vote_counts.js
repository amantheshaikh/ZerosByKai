import { supabaseAdmin } from '../config/supabase.js';

async function fixVoteCounts() {
  console.log('🚀 Starting vote count backfill...');

  // 1. Fetch all ideas
  const { data: ideas, error: ideasError } = await supabaseAdmin
    .from('ideas')
    .select('id, name');

  if (ideasError) throw ideasError;

  console.log(`Found ${ideas.length} ideas to check.`);

  for (const idea of ideas) {
    // Count votes for this idea
    const { count, error: countError } = await supabaseAdmin
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('idea_id', idea.id);

    if (countError) {
      console.error(`Error counting votes for ${idea.name}:`, countError);
      continue;
    }

    // Update the idea with the correct count
    const { error: updateError } = await supabaseAdmin
      .from('ideas')
      .update({ vote_count: count })
      .eq('id', idea.id);

    if (updateError) {
      console.error(`Error updating count for ${idea.name}:`, updateError);
    } else {
      console.log(`Updated ${idea.name}: ${count} votes.`);
    }
  }

  // 2. Sync Weekly Batches
  const { data: batches, error: batchesError } = await supabaseAdmin
    .from('weekly_batches')
    .select('week_start_date');

  if (batchesError) throw batchesError;

  for (const batch of batches) {
    const { data: batchIdeas } = await supabaseAdmin
      .from('ideas')
      .select('vote_count')
      .eq('week_published', batch.week_start_date);

    const totalVotes = batchIdeas?.reduce((sum, i) => sum + (i.vote_count || 0), 0) || 0;

    await supabaseAdmin
      .from('weekly_batches')
      .update({ total_votes: totalVotes })
      .eq('week_start_date', batch.week_start_date);
    
    console.log(`Updated batch ${batch.week_start_date}: ${totalVotes} total votes.`);
  }

  console.log('✅ Vote count backfill completed.');
}

fixVoteCounts().catch(console.error);

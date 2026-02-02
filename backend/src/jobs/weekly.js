import { supabaseAdmin } from '../config/supabase.js';
import { generateWeeklyDigestEmail } from '../emails/templates.js';
import { generateEmailToken } from '../utils/emailToken.js';
import { sendEmail } from '../utils/emailService.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';
import { maskEmail } from '../utils/helpers.js';
import { config } from '../config/env.js';




/**
 * Pull-based Publishing: Selects 10 ideas from the backlog and 
 * assigns them to the current week.
 */
export async function pickAndPublishIdeas() {
  try {
    const weekStart = getMonday();

    console.log(`📡 Picking 10 ideas from backlog for week ${weekStart}...`);

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
      console.log(`⚠️  Workflow skipped: ${currentBatch.total_ideas} ideas already published for week ${weekStart}.`);
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

    // Step 1: Select 10 oldest ideas from backlog
    console.log('🔍 Picking 10 ideas from backlog...');
    const { data: backlogIdeas, error: fetchError } = await supabaseAdmin
      .from('ideas')
      .select('id, name')
      .eq('status', 'backlog')
      .order('created_at', { ascending: true }) // FIFO: Oldest first
      .limit(10);

    if (fetchError) throw fetchError;

    if (!backlogIdeas || backlogIdeas.length < 10) {
      // Alert but publish what we have (or strict fail if you prefer)
      console.warn(`⚠️ Warning: Only found ${backlogIdeas?.length || 0} ideas in backlog (target: 10).`);
      if (!backlogIdeas || backlogIdeas.length === 0) return [];
    }

    // Step 2: Publish them (Atomic-ish)
    // We update them to 'published' and link to this week
    const ideaIds = backlogIdeas.map(i => i.id);
    const { data: published, error: updateError } = await supabaseAdmin
      .from('ideas')
      .update({
        status: 'published',
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

    console.log(`✅ Successfully published ${backlogIdeas.length} ideas for week ${weekStart}`);
    return published;
  } catch (error) {
    console.error('Error in pickAndPublishIdeas:', error);
    throw error;
  }
}

// Calculate winner and award badges
export async function calculateWinner() {
  try {
    // 1. Determine the week to calculate (the week BEFORE the newly published batch)
    const currentMonday = getMonday();
    const weekStart = getLastMonday(new Date(currentMonday));

    console.log(`🏆 Calculating winner for week ${weekStart} (preceding current week ${currentMonday})...`);

    // 1. Get ideas for that week
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from('ideas')
      .select('id, name, title')
      .eq('week_published', weekStart)
      .eq('status', 'published');

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      console.log(`No published ideas found for week ${weekStart}`);
      return;
    }

    // 2 & 3. Get vote counts and find winner efficiently
    const { data: allVotes, error: countError } = await supabaseAdmin
      .from('votes')
      .select('idea_id')
      .in('idea_id', ideas.map(i => i.id));

    if (countError) throw countError;

    // Map counts back to ideas
    const ideaVotes = ideas.map(idea => ({
      ...idea,
      voteCount: allVotes.filter(v => v.idea_id === idea.id).length
    }));

    const winner = ideaVotes.reduce((max, idea) =>
      idea.voteCount > max.voteCount ? idea : max
      , ideaVotes[0]);

    console.log(`Winner identified: ${winner.name} (${winner.voteCount} votes)`);

    // 4. Update Weekly Batch with winner
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('weekly_batches')
      .upsert({
        week_start_date: weekStart,
        winner_idea_id: winner.id,
        total_ideas: ideas.length,
        total_votes: ideaVotes.reduce((sum, i) => sum + i.voteCount, 0)
      }, {
        onConflict: 'week_start_date'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 5. Update Idea winner flag
    const { error: winnerStatusError } = await supabaseAdmin
      .from('ideas')
      .update({ is_winner: true })
      .eq('id', winner.id);

    if (winnerStatusError) {
      console.error(`❌ Failed to update winner status for idea ${winner.id}:`, winnerStatusError);
      throw new Error(`Critical failure: Could not set winner status for ${winner.id}`);
    }

    // 6. Archived ALL ideas from that week (including winner)
    const allBatchIdeaIds = ideas.map(i => i.id);
    if (allBatchIdeaIds.length > 0) {
      const { error: archiveError } = await supabaseAdmin
        .from('ideas')
        .update({ status: 'archived' })
        .in('id', allBatchIdeaIds);

      if (archiveError) {
        console.error('⚠️ Failed to archive batch ideas:', archiveError);
      } else {
        console.log(`📦 Archived all ${allBatchIdeaIds.length} ideas from week ${weekStart}.`);
      }
    }

    // 6. Award badges to users who voted for winner
    const { data: winningVoters, error: votersError } = await supabaseAdmin
      .from('votes')
      .select('user_id')
      .eq('idea_id', winner.id);

    if (votersError) throw votersError;

    if (winningVoters && winningVoters.length > 0) {
      const badges = winningVoters.map(v => ({
        user_id: v.user_id,
        idea_id: winner.id,
        badge_type: 'kai_pick'
      }));

      const { error: badgeError } = await supabaseAdmin
        .from('user_badges')
        .upsert(badges, {
          onConflict: 'user_id,idea_id',
          ignoreDuplicates: true
        });

      if (badgeError) throw badgeError;

      console.log(`Awarded badges to ${winningVoters.length} users`);
    }

    return { winner, batch, badgeCount: winningVoters?.length || 0 };
  } catch (error) {
    console.error('Error calculating winner:', error);
    throw error;
  }
}

// Send weekly digest to all subscribers
export async function sendWeeklyDigest() {
  try {
    const weekStart = getMonday();

    // Get this week's published ideas
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('week_published', weekStart)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      console.log('No published ideas for this week');
      return;
    }

    // Get last week's winner
    const lastWeekStart = getLastMonday(new Date(weekStart));

    const { data: lastWeekBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (*)
      `)
      .eq('week_start_date', lastWeekStart)
      .maybeSingle();

    // Get all active subscribers
    const { data: emailList, error: subsError } = await supabaseAdmin
      .from('subscribers')
      .select('email, name, user_id')
      .is('unsubscribed_at', null);

    if (subsError) throw subsError;

    console.log(`📡 Preparing digest for ${emailList.length} active subscribers via Amazon SES...`);

    const threadCount = 2100 + Math.floor(Math.random() * 450);

    // Generate email HTML base
    const baseHtml = generateWeeklyDigestEmail({
      ideas,
      winner: lastWeekBatch?.winner,
      threadCount,
      weekDate: new Date(weekStart).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    });

    // Sequential sending for Sandbox Mode (1 email/sec limit)
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of emailList) {
      const maskedEmail = maskEmail(subscriber.email);

      // Secure token for unsubscribe
      const token = generateEmailToken(subscriber.user_id || subscriber.email, subscriber.email);

      // Generate auth token for authenticated users
      let voteUrl = `${config.frontendUrl}?utm_source=email`;
      if (subscriber.user_id) {
        const authToken = generateEmailToken(subscriber.user_id, subscriber.email);
        voteUrl += `&token=${authToken}`;
      }

      const personalHtml = baseHtml
        .replace(
          `href="${config.frontendUrl}?utm_source=email"`,
          `href="${voteUrl}"`
        )
        .replace('{{email}}', subscriber.email)
        .replace('{{token}}', token);

      const unsubscribeUrl = `${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${token}`;

      const { success, error } = await sendEmail({
        to: subscriber.email,
        subject: `Kai's Zeros: Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: personalHtml,
        text: `Kai's Zeros - Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n10 new startup opportunities are waiting for you.\n\nView this week's ideas: ${voteUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });

      if (success) {
        console.log(`✅ Email sent to ${maskedEmail}`);
        successCount++;
      } else {
        console.error(`❌ Failed to send to ${maskedEmail}:`, error);
        failCount++;
      }

      // Respect Sandbox Rate Limit: Wait 1.1s between sends
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    console.log(`📊 Final Result: ${successCount} sent, ${failCount} failed.`);

    // Update batch status
    await supabaseAdmin
      .from('weekly_batches')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('week_start_date', weekStart);

    console.log(`✅ Weekly cycle complete for ${weekStart}`);

    return { sent: emailList.length, ideas: ideas.length };
  } catch (error) {
    console.error('Error sending weekly digest:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runWorkflow = async () => {
    // Check if we should only run on specific days (Monday=1)
    if (process.argv.includes('--scheduled')) {
      const day = new Date().getUTCDay();
      if (day !== 1) {
        console.log(`ℹ️  Not a scheduled Monday check (Day: ${day}). Skipping.`);
        process.exit(0);
      }
    }

    console.log('🚀 Starting Weekly Monday Workflow...');

    try {
      await pickAndPublishIdeas();
      await calculateWinner();
      await sendWeeklyDigest();
      console.log('✅ Weekly Workflow Completed Successfully.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Weekly Workflow Failed:', error);
      process.exit(1);
    }
  };

  runWorkflow();
}

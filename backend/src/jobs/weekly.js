import { supabaseAdmin } from '../config/supabase.js';
import { generateWeeklyDigestEmail } from '../emails/templates/weekly-digest.js';
import { generateEmailToken } from '../utils/emailToken.js';
import { sendBatchEmails } from '../utils/emailService.js';
import { getMonday, getLastMonday } from '../utils/dateUtils.js';
import { config } from '../config/env.js';




/**
 * Pull-based Publishing: Selects 10 opportunities from the backlog and 
 * assigns them to the current week.
 * @param {Date|string} targetDate - Optional date to target (defaults to current Monday)
 */


// Calculate winner and award badges
export async function calculateWinner() {
  try {
    // 1. Determine the week to calculate (the week BEFORE the newly published batch)
    const currentMonday = getMonday();
    const weekStart = getLastMonday(new Date(currentMonday));

    console.log(`🏆 Calculating winner for week ${weekStart} (preceding current week ${currentMonday})...`);

    // Check if winner already calculated this week (prevents race condition)
    const { data: existingBatch, error: checkError } = await supabaseAdmin
      .from('weekly_batches')
      .select('id, winner_calculated')
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingBatch?.winner_calculated) {
      console.log(`⏭️  Winner already calculated for ${weekStart}. Skipping to prevent race condition.`);
      return { skipped: true };
    }

    // 1. Get ideas for that week
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from('ideas')
      .select('id, name, title')
      .eq('week_published', weekStart)
      .eq('status', 'published');

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      console.log(`No published opportunities found for week ${weekStart}`);
      return;
    }

    // 2 & 3. Get vote counts and find winner (in-memory aggregation since group_by is not a JS client function)
    const { data: allVotes, error: countError } = await supabaseAdmin
      .from('votes')
      .select('idea_id')
      .in('idea_id', ideas.map(i => i.id));

    if (countError) throw countError;

    // Use a Map for in-memory counting
    const voteCountMap = new Map();
    (allVotes || []).forEach(v => {
      voteCountMap.set(v.idea_id, (voteCountMap.get(v.idea_id) || 0) + 1);
    });

    const ideaVotes = ideas.map(idea => ({
      ...idea,
      voteCount: voteCountMap.get(idea.id) || 0
    }));

    const totalVotes = ideaVotes.reduce((sum, i) => sum + i.voteCount, 0);
    const maxVotes = Math.max(...ideaVotes.map(i => i.voteCount));

    let winner = null;
    if (totalVotes > 0) {
      // Find the idea with the most votes (first one in case of tie)
      winner = ideaVotes.find(idea => idea.voteCount === maxVotes);
      console.log(`Winner identified: ${winner.name} (${winner.voteCount} votes)`);
    } else {
      console.log(`No winner identified for week ${weekStart}: Total votes is 0.`);
    }

    // 4. Update Weekly Batch with results and mark as calculated
    const updateData = {
      week_start_date: weekStart,
      total_ideas: ideas.length,
      total_votes: totalVotes,
      winner_calculated: true  // Mark as complete to prevent re-calculation
    };

    if (winner) {
      updateData.winner_idea_id = winner.id;
    }

    const { data: batch, error: batchError } = await supabaseAdmin
      .from('weekly_batches')
      .upsert(updateData, {
        onConflict: 'week_start_date'
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 5. Update Idea winner flag and award badges only if a winner exists
    let winningVotersCount = 0;
    if (winner) {
      const { error: winnerStatusError } = await supabaseAdmin
        .from('ideas')
        .update({ is_winner: true })
        .eq('id', winner.id);

      if (winnerStatusError) {
        console.error(`❌ Failed to update winner status for idea ${winner.id}:`, winnerStatusError);
        throw new Error(`Critical failure: Could not set winner status for ${winner.id}`);
      }
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
        console.log(`📦 Archived all ${allBatchIdeaIds.length} opportunities from week ${weekStart}.`);
      }
    }

    if (winner) {
      // 6. Award badges to users who voted for winner
      const { data: winningVoters, error: votersError } = await supabaseAdmin
        .from('votes')
        .select('user_id')
        .eq('idea_id', winner.id);

      if (votersError) throw votersError;

      if (winningVoters && winningVoters.length > 0) {
        winningVotersCount = winningVoters.length;
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

        console.log(`Awarded badges to ${winningVotersCount} users`);
      }
    }

    return { winner, batch, badgeCount: winningVotersCount };
  } catch (error) {
    console.error('Error calculating winner:', error);
    throw error;
  }
}

// Send weekly digest to all subscribers
export async function sendWeeklyDigest() {
  try {
    const weekStart = getMonday();

    // 1. Get this week's batch metadata first (checks for pre-defined subject)
    const { data: currentBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select('id, subject_line, winner_idea_id')
      .eq('week_start_date', weekStart)
      .maybeSingle();

    // 2. Publication Step: Transition 'scheduled' -> 'published'
    // This makes them visible on the website immediately before we send the email.
    console.log(`🔓 Publishing scheduled ideas for week ${weekStart}...`);

    // First, find ideas scheduled for this week
    const { data: scheduledIdeas, error: scheduleError } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('week_published', weekStart)
      .eq('status', 'scheduled');

    if (scheduleError) throw scheduleError;

    if (scheduledIdeas && scheduledIdeas.length > 0) {
      const { error: pubError } = await supabaseAdmin
        .from('ideas')
        .update({ status: 'published' })
        .in('id', scheduledIdeas.map(i => i.id));

      if (pubError) throw pubError;
      console.log(`✅ ${scheduledIdeas.length} ideas are now LIVE.`);
    }

    // 3. fetch published ideas (now they are published)
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('week_published', weekStart)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      console.log('No published opportunities for this week');
      return;
    }

    // 3. Get last week's winner (for email content)
    const lastWeekStart = getLastMonday(new Date(weekStart));

    const { data: lastWeekBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:ideas!fk_weekly_batches_winner_idea (*)
      `)
      .eq('week_start_date', lastWeekStart)
      .maybeSingle();

    // 4. Resolve Subject Line
    let emailSubject = currentBatch?.subject_line;
    const defaultSubject = `Kai's Zeros: Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    if (emailSubject) {
      console.log(`📌 Using pre-scheduled subject: "${emailSubject}"`);
    } else {
      console.log('📌 No subject line found in DB, using default.');
      emailSubject = defaultSubject;
    }

    // 5. Get all active subscribers
    const { data: emailList, error: subsError } = await supabaseAdmin
      .from('subscribers')
      .select('email, name, user_id')
      .is('unsubscribed_at', null);

    if (subsError) throw subsError;

    console.log(`📡 Preparing digest for ${emailList.length} active subscribers via Brevo...`);

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
      }),
      id: weekStart
    });

    // 6. Construct Batch Payloads
    const emailQueue = [];
    const plainTextTemplate = `Hi {{name}}!\n\nKai's Zeros - Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n10 new startup opportunities are waiting for you.\n\nView & vote on this week's opportunities: {{voteUrl}}\n\nUnsubscribe: {{unsubscribeUrl}}`;

    for (const subscriber of emailList) {
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
        .replace('{{token}}', token)
        .replace('{{name}}', subscriber.name ? subscriber.name.split(' ')[0] : 'there');

      const unsubscribeUrl = `${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${token}`;

      // Personalize plain text with name and URLs
      const personalPlainText = plainTextTemplate
        .replace('{{name}}', subscriber.name ? subscriber.name.split(' ')[0] : 'there')
        .replace('{{voteUrl}}', voteUrl)
        .replace('{{unsubscribeUrl}}', unsubscribeUrl);

      emailQueue.push({
        to: subscriber.email,
        subject: emailSubject,
        html: personalHtml,
        text: personalPlainText
      });
    }

    // 7. Send in Batches of 50
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failCount = 0;

    console.log(`🚀 Sending ${emailQueue.length} emails in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < emailQueue.length; i += BATCH_SIZE) {
      const chunk = emailQueue.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(emailQueue.length / BATCH_SIZE);
      console.log(`   Sending batch ${batchNum}/${totalBatches} (${chunk.length} emails)...`);

      const { success, error } = await sendBatchEmails(chunk, {
        tags: ['weekly-digest'],
        headers: {
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          // List-Unsubscribe header is tricky in batch if URLs differ per user. 
          // Brevo handles unsubscribe links automatically if using their template, but here we do custom.
          // V3 API supports params but headers are usually shared.
          // However, we embedded the unsubscribe link in HTML body which is safe.
        }
      });

      if (success) {
        successCount += chunk.length;
        console.log(`      ✅ Batch ${batchNum} sent successfully`);
      } else {
        failCount += chunk.length;
        console.error(`      ❌ Batch ${batchNum} failed: ${error?.message || 'Unknown error'}`);
      }

      // Slight delay between batches to be nice
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`📊 Final Result: ${successCount}/${emailQueue.length} sent, ${failCount} failed.`);

    // Alert if significant failure rate
    if (failCount > 0 && failCount > emailQueue.length * 0.1) {
      console.warn(`⚠️  WARNING: >10% failure rate (${failCount}/${emailQueue.length}). Check Brevo API.`);
    }

    // Update batch status
    await supabaseAdmin
      .from('weekly_batches')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('week_start_date', weekStart);

    console.log(`✅ Weekly cycle complete for ${weekStart}`);

    return { sent: emailList.length, ideas: ideas.length };
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    throw error;  // Propagate error so cron handler can see failure
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
      // Step 1: Calculate previous week's winner
      await calculateWinner();

      // Step 2: Send scheduled digest (if exists)
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

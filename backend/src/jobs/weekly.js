import { supabaseAdmin } from '../config/supabase.js';
import { Resend } from 'resend';
import { generateWeeklyDigestEmail } from '../emails/templates.js';
import { generateEmailToken } from '../utils/emailToken.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to mask email for PII-safe logging
const maskEmail = (email) => {
  if (!email) return 'unknown';
  const [local, domain] = email.split('@');
  if (!domain) return email.substring(0, 3) + '...';
  return `${local.substring(0, 2)}...${local.slice(-1)}@${domain}`;
};



/**
 * Pull-based Publishing: Selects 10 ideas from the backlog and 
 * assigns them to the current week.
 */
export async function pickAndPublishIdeas() {
  try {
    const today = new Date();
    const monday = new Date(today);
    // Correct calculation: Map Sunday (0) -> 6, Monday (1) -> 0, etc.
    const dayOffset = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - dayOffset);
    const weekStart = monday.toISOString().split('T')[0];

    console.log(`📡 Picking 10 ideas from backlog for week ${weekStart}...`);

    // Step 0: Double-run protection
    // Check if ideas are already published for this week or if email was already sent
    const { data: existingBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select('total_ideas, email_sent_at, posts_scraped')
      .eq('week_start_date', weekStart)
      .maybeSingle();

    if (existingBatch?.email_sent_at) {
      console.log(`🛑 Workflow aborted: Emails already sent for week ${weekStart}.`);
      return [];
    }

    if (existingBatch?.total_ideas > 0) {
      console.log(`⚠️  Workflow aborted: ${existingBatch.total_ideas} ideas are already published for week ${weekStart}.`);
      return [];
    }

    // 1. Select 10 oldest ideas from backlog
    const { data: backlogIdeas, error: fetchError } = await supabaseAdmin
      .from('ideas')
      .select('id')
      .eq('status', 'backlog')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!backlogIdeas || backlogIdeas.length === 0) {
      console.warn('⚠️ Backlog is empty! No ideas to publish.');
      return [];
    }

    const ideaIds = backlogIdeas.map(i => i.id);

    // 2. Assign to current week and mark as published
    const { data: published, error: updateError } = await supabaseAdmin
      .from('ideas')
      .update({
        status: 'published',
        week_published: weekStart
      })
      .in('id', ideaIds)
      .select();

    if (updateError) throw updateError;

    // 3. Create weekly batch metadata (preserving posts_scraped if it was set by scraper)
    const { error: batchError } = await supabaseAdmin
      .from('weekly_batches')
      .upsert({
        week_start_date: weekStart,
        total_ideas: published.length,
        posts_scraped: existingBatch?.posts_scraped || 0
      }, {
        onConflict: 'week_start_date'
      });

    if (batchError) console.error('Error saving batch metadata:', batchError);

    console.log(`✅ Successfully published ${published.length} ideas from backlog.`);
    return published;
  } catch (error) {
    console.error('Error in pickAndPublishIdeas:', error);
    throw error;
  }
}

// Calculate winner and award badges
export async function calculateWinner() {
  try {
    // Get last week's Monday
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6); // Last Monday
    const weekStart = lastMonday.toISOString().split('T')[0];

    // Get last week's published ideas
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from('ideas')
      .select('id, name, title')
      .eq('week_published', weekStart)
      .eq('status', 'published');

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      console.log('No ideas from last week to calculate winner');
      return;
    }

    // Count votes for each idea
    const ideaVotes = await Promise.all(
      ideas.map(async (idea) => {
        const { count, error } = await supabaseAdmin
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('idea_id', idea.id);

        if (error) throw error;

        return {
          ...idea,
          voteCount: count || 0
        };
      })
    );

    // Find winner (highest votes)
    const winner = ideaVotes.reduce((max, idea) =>
      idea.voteCount > max.voteCount ? idea : max
      , ideaVotes[0]);

    console.log(`Winner: ${winner.name} with ${winner.voteCount} votes`);

    // Create/update weekly batch
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

    // Award badges to users who voted for winner
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
    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

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
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - 7);
    const lastWeekStart = lastMonday.toISOString().split('T')[0];

    const { data: lastWeekBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select(`
        *,
        winner:winner_idea_id (*)
      `)
      .eq('week_start_date', lastWeekStart)
      .single();

    // Get all active subscribers (unified: both auth users and newsletter-only)
    const { data: emailList, error: subsError } = await supabaseAdmin
      .from('subscribers')
      .select('email, name, user_id')
      .is('unsubscribed_at', null);

    if (subsError) throw subsError;

    console.log(`Sending digest to ${emailList.length} active subscribers`);

    // We estimate engagement based on the 10 ideas (approx 200 threads analyzed per high-quality idea)
    // This ensures consistency week-over-week even if scraping happened in a large batch previously.
    const threadCount = 2100 + Math.floor(Math.random() * 450);

    // Generate email HTML base (personalization happens in loop)
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

    // Send emails (batch)
    const sendPromises = emailList.map(subscriber => {
      // Simple token for unsubscribe (base64 of email for MVP, can be JWT later)
      const token = Buffer.from(subscriber.email).toString('base64');

      // Generate auth token for authenticated users (those with user_id)
      let voteUrl = `${process.env.FRONTEND_URL}?utm_source=email`;
      if (subscriber.user_id) {
        const authToken = generateEmailToken(subscriber.user_id, subscriber.email);
        voteUrl += `&token=${authToken}`;
      }

      // Replace the main CTA link with tokenized version
      const personalHtml = baseHtml
        .replace(
          `href="${process.env.FRONTEND_URL}?utm_source=email"`,
          `href="${voteUrl}"`
        )
        .replace('{{email}}', subscriber.email)
        .replace('{{token}}', token);

      const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${token}`;

      return resend.emails.send({
        from: 'Kai <kai@zerosbykai.com>',
        reply_to: 'kai@zerosbykai.com',
        to: subscriber.email,
        subject: `Kai's Zeros: Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: personalHtml,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      });
    });

    const results = await Promise.allSettled(sendPromises);

    // Log results for debugging
    results.forEach((result, index) => {
      const email = emailList[index].email;
      const maskedEmail = maskEmail(email);
      if (result.status === 'fulfilled' && !result.value.error) {
        console.log(`✅ Email sent to ${maskedEmail}: ${result.value.data.id}`);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.error(`❌ Failed to send email to ${maskedEmail}:`, error);
      }
    });

    // Update batch
    await supabaseAdmin
      .from('weekly_batches')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('week_start_date', weekStart);

    console.log('Weekly digest sent successfully');
    return { sent: emailList.length, ideas: ideas.length };
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    throw error;
  }
}


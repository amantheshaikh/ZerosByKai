import { supabaseAdmin } from '../config/supabase.js';
import { Resend } from 'resend';
import { generateWeeklyDigestEmail } from '../emails/templates.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Auto-publish pending/approved ideas for this week
export async function autoPublishIdeas() {
  try {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('ideas')
      .update({ status: 'published' })
      .eq('week_published', weekStart)
      .eq('status', 'pending')
      .select();

    if (error) throw error;

    console.log(`Auto-published ${data?.length || 0} ideas for week ${weekStart}`);
    return data;
  } catch (error) {
    console.error('Error auto-publishing ideas:', error);
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

    // Get auth user emails
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    const authEmailList = authUsers.users.map(u => ({
      email: u.email,
      name: u.user_metadata?.name || u.email.split('@')[0]
    }));

    // Get newsletter-only subscribers
    const { data: subscribers, error: subsError } = await supabaseAdmin
      .from('subscribers')
      .select('email, name')
      .is('unsubscribed_at', null);

    if (subsError) throw subsError;

    // Merge both lists, dedup by email (auth users take priority)
    // Also suppressed unsubscribed emails (checked against subscribers table)
    const uniqueEmails = new Map();

    // 1. Add Auth Users first
    authEmailList.forEach(u => {
      uniqueEmails.set(u.email, { ...u, type: 'auth' });
    });

    // 2. Add Newsletter Subscribers (only if not already present)
    subscribers.forEach(s => {
      if (!uniqueEmails.has(s.email)) {
        uniqueEmails.set(s.email, { ...s, type: 'subscriber' });
      }
    });

    // 3. Filter out globally unsubscribed (users who are in subscribers table with unsubscribed_at set)
    // We need to check the 'subscribers' table for suppression list even for auth users
    const { data: suppressionList } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .not('unsubscribed_at', 'is', null);

    const suppressedEmails = new Set(suppressionList?.map(s => s.email) || []);

    const emailList = Array.from(uniqueEmails.values()).filter(u => !suppressedEmails.has(u.email));

    console.log(`Sending digest to ${emailList.length} unique subscribers (deduplicated & filtered)`);

    // Get posts_scraped count from current week's batch
    const { data: currentBatch } = await supabaseAdmin
      .from('weekly_batches')
      .select('posts_scraped')
      .eq('week_start_date', weekStart)
      .single();

    const threadCount = currentBatch?.posts_scraped || ideas.length;

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
      const personalHtml = baseHtml
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

    await Promise.allSettled(sendPromises);

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


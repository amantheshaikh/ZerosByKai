import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// POST /api/webhook/bubblelab - Receive ideas from BubbleLab
router.post('/bubblelab', async (req, res) => {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.BUBBLELAB_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const { batch_id, ideas, metadata } = req.body;

    if (!ideas || !Array.isArray(ideas)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    // Extract keywords for diversity check
    const extractKeywords = (text) => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4); // Only words > 4 chars
      return [...new Set(words)].slice(0, 10); // Top 10 unique
    };

    // Get last 20 published ideas for diversity check
    const { data: recentIdeas } = await supabaseAdmin
      .from('ideas')
      .select('problem_keywords, theme')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    // Insert ideas
    const insertedIdeas = [];
    for (const idea of ideas) {
      const keywords = extractKeywords(idea.problem || '');
      
      // Simple diversity check
      let similarityWarning = null;
      if (recentIdeas && recentIdeas.length > 0) {
        for (const recent of recentIdeas) {
          if (!recent.problem_keywords) continue;
          const overlap = keywords.filter(k => recent.problem_keywords.includes(k));
          const similarity = (overlap.length / keywords.length) * 100;
          
          if (similarity > 50) {
            similarityWarning = `${similarity.toFixed(0)}% similar to recent idea`;
            break;
          }
        }
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('ideas')
        .insert({
          name: idea.name,
          title: idea.title || idea.name,
          problem: idea.problem,
          solution: idea.solution,
          target_audience: idea.targetAudience || idea.target,
          why_it_matters: idea.whyItMatters || idea.why,
          source_links: idea.sourceUrls || idea.sources || [],
          tags: idea.tags || idea.suggestedTags || {},
          week_published: weekStart,
          status: 'pending',
          problem_keywords: keywords,
          theme: idea.theme || null,
          bubblelab_batch_id: batch_id,
          moderation_notes: similarityWarning
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting idea:', error);
        continue;
      }

      insertedIdeas.push(inserted);
    }

    res.json({ 
      message: `${insertedIdeas.length} ideas received and queued for moderation`,
      ideas: insertedIdeas,
      weekStart
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

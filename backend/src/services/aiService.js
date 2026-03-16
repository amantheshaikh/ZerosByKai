import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service for Ideas Generation
 */
export class AIService {
    constructor(config) {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.models = config.gemini.models;
        this.exclusionList = [];
    }

    setExclusionList(titles) {
        this.exclusionList = titles;
    }

    async generateIdeas(posts, count) {
        // Input validation
        if (!Array.isArray(posts) || posts.length === 0) {
            throw new Error('Posts array is required and must contain at least one post');
        }

        // Adjust count if needed (cap at max 50, floor at min 1)
        let adjustedCount = Math.max(1, Math.min(Math.floor(count), 50));
        if (adjustedCount !== count) {
            console.warn(`[AI] Adjusted generation count from ${count} to ${adjustedCount} (must be 1-50)`);
        }

        // Smart exclusion list handling: keep only the most recent 100 published ideas
        let exclusionList = this.exclusionList;
        if (exclusionList && exclusionList.length > 100) {
            exclusionList = exclusionList.slice(0, 100); // Keep most recent 100
            console.log(`[AI] Using last 100 published ideas in exclusion list (trimmed from ${this.exclusionList.length})`);
        }

        // Sanitize and limit post size to avoid huge prompts
        const sanitizedPosts = posts.map(p => ({
            title: String(p.title || p.name || '').substring(0, 1000),
            body: String(p.body || p.text || '').substring(0, 5000),
            source: p.source || (p.subreddit ? 'r/' + p.subreddit : 'unknown')
        }));

        const prompt = this._buildPrompt(sanitizedPosts, adjustedCount, exclusionList);

        const chain = Object.values(this.models).filter(Boolean);

        if (chain.length === 0) {
            throw new Error("No AI models configured. Please check GEMINI_API_KEY and model configuration.");
        }

        for (const model of chain) {
            try {
                return await this._callGemini(model, prompt);
            } catch (e) {
                console.warn(`[AI] Model ${model} failed: ${e.message}`);
                // If it's the last model, throw
                if (model === chain[chain.length - 1]) throw e;

                // If rate limit (429), wait before trying next
                if (e.message.includes('429')) {
                    console.warn('[AI] Rate limited. Waiting 10s before retry...');
                    await new Promise(r => setTimeout(r, 10000));
                }
            }
        }
    }

    async _callGemini(modelName, prompt) {
        // Enforces array return type for existing callers (generateIdeas)
        const result = await this._callGeminiGeneric(modelName, prompt);
        if (!Array.isArray(result)) throw new Error("AI did not return an array");
        return result;
    }

    async dedupeAndSynthesizeIdeas(generatedIdeasBySource) {
        /**
         * Takes ideas generated from multiple sources and dedupes/synthesizes them
         * into a final curated list (up to 40 ideas).
         * 
         * @param {Object} generatedIdeasBySource - { reddit: [...], hn: [...], ih: [...], x: [...] }
         * @returns {Promise<Array>} Deduplicated and synthesized ideas
         */
        const allGeneratedIdeas = Object.entries(generatedIdeasBySource)
            .flatMap(([source, ideas]) => ideas.map(idea => ({ ...idea, _source: source })));

        if (allGeneratedIdeas.length === 0) {
            console.warn('[AI] No ideas to dedupe/synthesize');
            return [];
        }

        // Format ideas for deduplication prompt
        const ideasText = allGeneratedIdeas
            .map((idea, idx) => `${idx + 1}. [${idea._source}] **${idea.title}**: ${idea.problem} → ${idea.solution}`)
            .join('\n');

        const prompt = this._buildDedupePrompt(ideasText, allGeneratedIdeas.length);

        const chain = Object.values(this.models).filter(Boolean);

        for (const model of chain) {
            try {
                const response = await this._callGeminiGeneric(model, prompt);
                console.log(`[AI] Dedupe/Synthesis completed: ${response.length} final ideas from ${allGeneratedIdeas.length} candidates`);
                return response;
            } catch (e) {
                console.warn(`[AI] Dedupe failed on ${model}: ${e.message}`);
                if (model === chain[chain.length - 1]) throw e;
            }
        }

        return [];
    }

    async generateNewsletterSubject(ideas) {
        // Gracefully handle missing or empty ideas
        if (!Array.isArray(ideas) || ideas.length === 0) {
            console.warn('[AI] No ideas provided for subject generation, using fallback');
            return "Kai's Zeros: This Week's Startup Opportunities";
        }

        const prompt = this._buildSubjectPrompt(ideas);

        // Try using the primary model, fall back if needed
        const chain = Object.values(this.models).filter(Boolean);

        for (const model of chain) {
            try {
                const response = await this._callGeminiGeneric(model, prompt);
                return response.subject;
            } catch (e) {
                console.warn(`[AI] Subject generation failed on ${model}: ${e.message}`);
                // If it's the last model, throw
                if (model === chain[chain.length - 1]) throw e;
            }
        }
        // Fallback if loop finishes without return (shouldn't happen due to throw)
        return null;
    }

    async regenerateNames(ideas) {
        if (!Array.isArray(ideas) || ideas.length === 0) return [];

        const ideasText = ideas
            .map((idea, idx) => `${idx + 1}. Title: ${idea.title}\n   Problem: ${idea.problem}\n   Solution: ${idea.solution}`)
            .join('\n\n');

        const prompt = `
            You are Kai, an expert brand consultant for high-growth startups.
            I have a list of startup ideas. I need you to generate a unique, catchy, and brandable startup name for each one.

            **Naming Heuristics:**
            1. **Style**: Modern, punchy, and brandable company names (1-3 words). Think Stripe, DocSync, Supabase, Antigravity, Too Many Tabs, HubSpot, Third Space, Corner Office, Urban Ladder, Pantry Pulse.
            2. **Forbidden (Generic)**: ABSOLUTELY NO generic technical descriptors like "Optimizer", "Platform", "Tool", "System", "Suite", "Utility", "Solution", "Hub", "Center".
            3. **Forbidden (Metaphorical)**: DO NOT use overly artistic or metaphorical "The [Noun]" names (e.g., "The Skeptic", "The Well", "The Skeleton"). These are for books, not startups.

            **Ideas to Rename:**
            ${ideasText}

            **Output Format (Strict JSON array of objects):**
            [
              {
                "id": "[Fill with original index 1-based]",
                "name": "Refined Startup Name"
              }
            ]
        `;

        const chain = Object.values(this.models).filter(Boolean);
        for (const model of chain) {
            try {
                const result = await this._callGeminiGeneric(model, prompt);
                if (!Array.isArray(result)) throw new Error("AI did not return an array");

                // Map back to original ideas
                return ideas.map((idea, idx) => {
                    const aiMatch = result.find(r => parseInt(r.id) === idx + 1);
                    return {
                        ...idea,
                        name: aiMatch ? aiMatch.name : idea.name
                    };
                });
            } catch (e) {
                console.warn(`[AI] Renaming failed with ${model}: ${e.message}`);
                if (model === chain[chain.length - 1]) throw e;
            }
        }
    }

    async refineExistingIdeas(ideas) {
        if (!Array.isArray(ideas) || ideas.length === 0) return [];

        const ideasText = ideas
            .map((idea, idx) => `
ID: ${idx + 1}
Current Name: ${idea.name}
Current Title: ${idea.title}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target Audience: ${idea.target_audience}
Tags: ${idea.tags ? idea.tags.join(', ') : 'None'}
Why It Matters: ${idea.why_it_matters || 'None'}
            `.trim())
            .join('\n\n---\n\n');

        const prompt = `
            You are Kai, an expert opportunity analyst and brand consultant.
            I have a list of existing startup ideas that need refinement according to my latest heuristics.

            **Heuristics:**
            1. **Naming**: Names MUST be modern, punchy startup names (1-3 words). 
               - GOOD: Stripe, DocSync, Supabase, Antigravity, Too Many Tabs, HubSpot, Third Space, Corner Office, Urban Ladder, Pantry Pulse.
               - FORBIDDEN (Generic): "Optimizer", "Platform", "Tool", "System", "Suite", "Utility", "Solution", "Hub", "Center".
               - FORBIDDEN (Metaphorical): Overly artistic "The [Noun]" names (e.g., "The Skeptic", "The Well").
            2. **Clean Content**: Remove ALL mentions of specific subreddits (e.g., "r/SaaS", "Reddit") from the Title, Problem, and Solution. Use general terms like "online communities".
            3. **Tags**: Standardize tags into 1-2 word categories.
            4. **Character Limits**: 
               - **Problem**: Max 180 characters.
               - **Solution**: Max 180 characters.
               - **Why It Matters**: Max 180 characters.
            5. **Tone**: The tone should be punchy, insightful, and professional.

            **Ideas to Refine:**
            ${ideasText}

            **Output Format (Strict JSON array of objects):**
            [
              {
                "id": "[Fill with original ID provided above]",
                "name": "Refined Creative Name",
                "title": "Refined Title (No subreddit mentions)",
                "problem": "Refined Problem (No subreddit mentions)",
                "solution": "Refined Solution (No subreddit mentions)",
                "target_audience": "Specific Niche Audience",
                "tags": ["Tag1", "Tag2"],
                "why_it_matters": "Refined Market sizing/why now (No subreddit mentions)"
              }
            ]
        `;

        const chain = Object.values(this.models).filter(Boolean);
        for (const model of chain) {
            try {
                const result = await this._callGeminiGeneric(model, prompt);
                if (!Array.isArray(result)) throw new Error("AI did not return an array");

                // Map back to original ideas (preserving original fields like id from DB)
                return ideas.map((idea, idx) => {
                    const aiMatch = result.find(r => parseInt(r.id) === idx + 1);
                    if (!aiMatch) return idea;

                    return {
                        ...idea,
                        name: aiMatch.name || idea.name,
                        title: aiMatch.title || idea.title,
                        problem: aiMatch.problem || idea.problem,
                        solution: aiMatch.solution || idea.solution,
                        target_audience: aiMatch.target_audience || idea.target_audience,
                        tags: aiMatch.tags || idea.tags,
                        why_it_matters: aiMatch.why_it_matters || idea.why_it_matters
                    };
                });
            } catch (e) {
                console.warn(`[AI] Refinement failed with ${model}: ${e.message}`);
                if (model === chain[chain.length - 1]) throw e;
            }
        }
    }

    async _callGeminiGeneric(modelName, prompt) {
        console.log(`[AI] Calling model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // More robust JSON extraction — try array first, then object (e.g. generateNewsletterSubject)
        const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanJson);
        } catch (e) {
            throw new Error(`Failed to parse AI response as JSON: ${text}`);
        }
    }

    _buildPrompt(posts, count, exclusionList = []) {
        const exclusionText = this._formatExclusionList(exclusionList);

        return `
            You are Kai, an expert opportunity analyst. 
            Analyze these Reddit posts to identify recurring pain points and synthesize "Investable Opportunities" (Zeros).

            **Input Data:**
            ${posts.map(p => `[${p.source || (p.subreddit ? 'r/' + p.subreddit : 'unknown')}] ${p.title}: ${(p.body || '').substring(0, 300)}`).join('\n')}

            ${exclusionText}

            **Task:**
            Generate ${count} distinct, high-quality startup ideas ("Zeros").
            
            **Rules:**
            1. **Naming**: Generate modern, punchy, brandable startup names (1-3 words). 
               - Think: Stripe, DocSync, Supabase, Antigravity, Too Many Tabs, HubSpot, Third Space, Corner Office, Urban Ladder, Pantry Pulse.
               - FORBIDDEN: Generic descriptors (Optimizer, Platform, Tool, System, Suite, Utility, Solution, Hub, Center) and metaphorical "The [Noun]" names (The Skeptic, The Well).
            2. **Clean Content**: Remove ALL mentions of specific subreddits (e.g., "r/SaaS", "Reddit") from all fields.
            3. **Tags**: Use standard 1-2 word categories.
            4. **Character Limits**:
               - **Problem**: Max 180 characters.
               - **Solution**: Max 180 characters.
               - **Why/Market sizing**: Max 180 characters.

            **Output Format (Strict JSON array of objects):**
            [
              {
                "name": "Brandable Startup Name",
                "title": "Descriptive Title (NO subreddit mentions)",
                "tags": ["Tag1", "Tag2"],
                "problem": "Pain point description (NO subreddit mentions).",
                "solution": "MVP solution (Primary context for the name - BUT DO NOT DESCRIBE IT).",
                "target_audience": "Specific Niche Audience",
                "why": "Market sizing/why now."
              }
            ]
        `;
    }

    _formatExclusionList(exclusionList) {
        const listToUse = exclusionList.length > 0 ? exclusionList : this.exclusionList;
        if (!listToUse || listToUse.length === 0) return "";

        const batch1 = listToUse.slice(0, 50);
        const batch2 = listToUse.slice(50, 100);

        let text = "\n**EXCLUSION LIST (Do NOT repeat these ideas):**\n";

        if (batch1.length > 0) {
            text += `\n### MOST RECENT IDEAS (1-50):\n- ${batch1.join('\n- ')}\n`;
        }

        if (batch2.length > 0) {
            text += `\n### EARLIER IDEAS (51-100):\n- ${batch2.join('\n- ')}\n`;
        }

        return text;
    }

    _buildDedupePrompt(ideasText, totalCount) {
        return `
            You are Kai, an expert opportunity analyst doing quality control and synthesis.
            
            You have received ${totalCount} startup ideas from multiple sources(Reddit, HN, Indie Hackers, X / Twitter).
            Many may be duplicates or similar concepts.Your job is to:

        1. ** Identify Duplicates **: Ideas that are essentially the same concept
        2. ** Synthesize **: Merge similar ideas into one stronger idea
        3. ** Curate **: Keep only the highest - quality, most novel ideas
        4. ** Maintain Diversity **: Ensure ideas span different industries / categories

            ** Ideas to Dedupe:**
                ${ideasText}
            
            ** Selection Criteria:**
            - Novelty: Avoid repeating concepts already in the list
                - Clarity: Problem and solution should be clear
                    - Market Size: Should serve a meaningful market
                        - Feasibility: Should be buildable as an MVP
                            - Diversity: Different industries / verticals preferred
            - **Clean Content**: ABSOLUTELY NO subreddit mentions (r/SaaS etc.) in the output.
            - **Character Limits**: 
               - **Problem**: Max 180 characters.
               - **Solution**: Max 180 characters.
               - **Why/Market sizing**: Max 180 characters.

                                ** Output Requirements:**
                                    - Return up to 40 final ideas(can be fewer if quality is the priority)
        - DO remove near - duplicates
            - DO merge very similar ideas
                - DO keep ideas from all sources if they're unique
                    - KEEP the same JSON format

                        ** Output Format(Strict JSON array):**
                            [
                                {
                                    "name": "Brandable Startup Name (1-3 words, modern, punchy. NO generic technical descriptors, NO metaphorical 'The [Noun]' names.)",
                                    "title": "Descriptive Title (NO subreddit mentions)",
                                    "tags": ["Tag1", "Tag2"],
                                    "problem": "Pain point description (NO subreddit mentions).",
                                    "solution": "MVP solution (NO subreddit mentions).",
                                    "target_audience": "Niche audience.",
                                    "why": "Market sizing/why now."
                                }
                            ]
                                `;
    }

    _buildSubjectPrompt(ideas) {
        const ideasList = ideas.map(i => `- ${i.title} (Tags: ${i.tags ? i.tags.join(', ') : ''
            })`).join('\n');

        return `
            You are Kai, writing the subject line for the "Kai's Zeros" weekly newsletter. 
            This newsletter contains 10 highly-specific, analyzed startup opportunities.
            
            **The 10 Ideas for this week:**
            ${ideasList}

            **GOAL:**
            Select the TWO most compelling idea titles from the list above and generate a subject line in the EXACT format:
            "[Title 1], [Title 2], & more - ZerosByKai"
            
            **RULES:**
            1. **FORMAT**: Use the exact template: "Title 1, Title 2, & more - ZerosByKai".
            2. **SELECTION**: Pick the two most interesting or provocative titles from the provided list.
            3. **CONSTRAINTS**: Max 85 characters. No emojis. Keep it professional and punchy.

            **Output Format (Strict JSON):**
            {
              "subject": "Selected Title 1, Selected Title 2, & more - ZerosByKai"
            }
        `;
    }
}

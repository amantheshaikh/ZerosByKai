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

        const chain = [
            this.models.primary,
            this.models.fallback,
            this.models.fallbackBackup
        ].filter(Boolean);

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

        const chain = [
            this.models.primary,
            this.models.fallback
        ].filter(Boolean);

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

    async generateNewsletterSubject(ideas, winner) {
        // Gracefully handle missing or empty ideas
        if (!Array.isArray(ideas) || ideas.length === 0) {
            console.warn('[AI] No ideas provided for subject generation, using fallback');
            return {
                subject: "Kai's Zeros: This Week's Startup Opportunities"
            };
        }

        const prompt = this._buildSubjectPrompt(ideas, winner);

        // Try using the primary model, fall back if needed
        const chain = [
            this.models.primary,
            this.models.fallback
        ].filter(Boolean);

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
            You are Kai, an expert brand consultant.
            I have a list of startup ideas. I need you to generate a unique, catchy, and creative multi-word brand name for each one.
            The name should be primarily inspired by the **Solution**.

            **Ideas to Rename:**
            ${ideasText}

            **Requirements:**
            - Names MUST be creative, eccentric, and show real "character".
            - STRICTLY FORBIDDEN: Generic technical descriptors (e.g., "On-Device Utility", "File Converter", "Payment Tool", "Soft Landing", "Planner", "System").
            - Favor punchy 1-2 word names or clever idioms that feel like a high-end brand.
            - The name should be primarily inspired by the **Solution** vibe, not its function.
            - Do NOT use the examples literally.
            - Ensure names are distinct for each idea.
            - KEEP the same JSON format.

            **Output Format (Strict JSON array of objects):**
            [
              {
                "id": "[Fill with original index 1-based]",
                "name": "New Creative name"
              }
            ]
        `;

        const chain = [this.models.primary, this.models.fallback].filter(Boolean);
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

    async _callGeminiGeneric(modelName, prompt) {
        console.log(`[AI] Calling model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // More robust JSON extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/);
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
            
            **Output Format (Strict JSON array of objects):**
            [
              {
                "name": "Eccentric Brand Name (Must be creative, punchy, and have 'soul'. ABSOLUTELY NO technical descriptors like 'Utility', 'Tool', 'Planner', 'Platform', 'System', 'Suite', 'Solution', 'Optimizer'. Think Slack, Ghost, Linear, or clever idioms like 'Too Many Tabs', 'Stop The Scroll'. Be brave and quirky.)",
                "title": "Descriptive Title",
                "tags": ["Tag1", "Tag2"],
                "problem": "Pain point description.",
                "solution": "MVP solution (Primary context for the name - BUT DO NOT DESCRIBE IT).",
                "target": "Niche audience.",
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

                                ** Output Requirements:**
                                    - Return up to 40 final ideas(can be fewer if quality is the priority)
        - DO remove near - duplicates
            - DO merge very similar ideas
                - DO keep ideas from all sources if they're unique
                    - KEEP the same JSON format

                        ** Output Format(Strict JSON array):**
                            [
                                {
                                    "name": "Eccentric Brand Name (Must be creative, punchy, and have 'soul'. ABSOLUTELY NO technical descriptors like 'Utility', 'Tool', 'Planner', 'Platform', 'System', 'Suite', 'Solution', 'Optimizer'. Think Slack, Ghost, Linear, or clever idioms like 'Too Many Tabs', 'Stop The Scroll'. Be brave and quirky.)",
                                    "title": "Descriptive Title",
                                    "tags": ["Tag1", "Tag2"],
                                    "problem": "Pain point description.",
                                    "solution": "MVP solution (Primary context for the name - BUT DO NOT DESCRIBE IT).",
                                    "target": "Niche audience.",
                                    "why": "Market sizing/why now."
                                }
                            ]
                                `;
    }

    _buildSubjectPrompt(ideas, winner) {
        const ideasList = ideas.map(i => `- ${i.title} (Tags: ${i.tags ? i.tags.join(', ') : ''
            })`).join('\n');
        const winnerText = winner ? `\n(Previous Week's Winner: "${winner.name}: ${winner.title}")` : "";

        return `
            You are writing the subject line for a weekly newsletter called "Kai's Zeros". 
            The newsletter contains 10 new startup opportunities (ideas).
            
            **The 10 Ideas:**
            ${ideasList}
            ${winnerText}

            **Goal:**
            Write ONE catchy, high-converting email subject line.
            
            **Styles (Vary this):**
            - Trend-focused (e.g., "The Unbundling of SaaS", "Why X is booming")
            - Problem-focused (e.g., "Everyone is tired of Subscription Fatigue")
            - Winner-focused (e.g., "The idea that everyone loved last week")
            - Curiosity-inducing
            
            **Constraints:**
            - Keep it under 50 characters if possible, max 70.
            - Do NOT use "Kai's Zeros" in the subject (tracker already knows who it is from).
            - Do NOT use emojis.
            - Do NOT use generic text like "Weekly Newsletter".
            
            **Output Format (Strict JSON):**
            {
              "subject": "The computed subject line"
            }
        `;
    }
}

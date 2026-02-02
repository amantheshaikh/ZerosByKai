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
        const prompt = this._buildPrompt(posts, count);

        try {
            // Try Primary
            return await this._callGemini(this.models.primary, prompt);
        } catch (e) {
            console.warn(`AI Primary Model failed, falling back: ${e.message}`);
            // Try Fallback
            return await this._callGemini(this.models.fallback, prompt);
        }
    }

    async _callGemini(modelName, prompt) {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean and parse
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const ideas = JSON.parse(cleanJson);

        if (!Array.isArray(ideas)) throw new Error("AI did not return an array");
        return ideas;
    }

    _buildPrompt(posts, count) {
        const exclusionText = this.exclusionList.length > 0
            ? `\n**EXCLUSION LIST (Do NOT repeat these ideas):**\n- ${this.exclusionList.join('\n- ')}`
            : "";

        return `
            You are Kai, an expert opportunity analyst. 
            Analyze these Reddit posts to identify recurring pain points and synthesize "Investable Opportunities" (Zeros).

            **Input Data:**
            ${posts.map(p => `[r/${p.subreddit}] ${p.title}: ${p.body.substring(0, 300)}`).join('\n')}

            ${exclusionText}

            **Task:**
            Generate ${count} distinct, high-quality startup ideas ("Zeros").
            
            **Output Format (Strict JSON array):**
            [
              {
                "name": "One-Word Name",
                "title": "Descriptive Title",
                "tags": ["Tag1", "Tag2"],
                "problem": "Pain point description.",
                "solution": "MVP solution.",
                "target": "Niche audience.",
                "why": "Market sizing/why now."
              }
            ]
        `;
    }
}

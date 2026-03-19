import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('GEMINI_API_KEY missing');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

const idea = "An AI-powered assistant that helps users make high-stakes purchase decisions (cars, laptops, insurance, etc.) by collecting their preferences and cross-referencing with expert reviews and user data.";

const prompt = `You are Kai — a brutally honest AI startup analyst...
Return ONLY a valid JSON object. No markdown fences, no backticks, no explanation. Just raw JSON matching this exact structure:

{
  "summary": "A one-line professional summary of the startup idea (max 100 characters)",
  "verdict": "One brutally honest sentence verdict on this idea (max 120 characters)",
  "roast_score": 10,
  "score_label": "...",
  "what_went_wrong": ["..."],
  "who_already_did_it": "...",
  "founder_archetype": "...",
  "survivability": "...",
  "one_real_advice": "...",
  "closing_burn": "..."
}

STARTUP IDEA:
${JSON.stringify(idea)}`;

async function test() {
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log('Response:', text);
        const data = JSON.parse(text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim());
        if (data.summary) {
            console.log('✅ Summary found:', data.summary);
        } else {
            console.error('❌ Summary missing');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

test();

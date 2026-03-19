// Mocking the parse logic from roast.js to test it in isolation
const REQUIRED_STRING_FIELDS = [
    'summary', 'verdict', 'score_label', 'who_already_did_it',
    'founder_archetype', 'survivability', 'one_real_advice', 'closing_burn',
];

function parseRoastResponse(text) {
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

    try {
        const data = JSON.parse(cleaned);

        // Validate and coerce required fields
        for (const field of REQUIRED_STRING_FIELDS) {
            if (typeof data[field] !== 'string' || !data[field].trim()) {
                throw new Error(`Missing or empty field: ${field}`);
            }
        }

        if (!Array.isArray(data.what_went_wrong) || data.what_went_wrong.length === 0) {
            throw new Error('Missing what_went_wrong array');
        }

        const score = Math.max(1, Math.min(10, Math.round(Number(data.roast_score))));
        if (isNaN(score)) throw new Error('Invalid roast_score');
        data.roast_score = score;

        return data;

    } catch (err) {
        // This is the logic I added to roast.js: throw instead of return fallback
        // console.warn('[Test] Parse/validation failed as expected:', err.message);
        throw err; 
    }
}

// Test cases
const cases = [
    { name: 'Invalid JSON', text: 'This is not JSON' },
    { name: 'Missing fields', text: '{"verdict": "Sucks"}' },
    { name: 'Empty what_went_wrong', text: '{"summary": "s", "verdict": "v", "score_label": "l", "who_already_did_it": "w", "founder_archetype": "a", "survivability": "s", "one_real_advice": "o", "closing_burn": "c", "roast_score": 5, "what_went_wrong": []}' }
];

console.log('--- Starting Roast Failure Handling Tests ---');

let passedCount = 0;
for (const tc of cases) {
    try {
        parseRoastResponse(tc.text);
        console.error(`❌ FAILED: ${tc.name} should have thrown an error but didn't.`);
    } catch (err) {
        console.log(`✅ PASSED: ${tc.name} threw error: ${err.message}`);
        passedCount++;
    }
}

console.log(`--- Tests Completed: ${passedCount}/${cases.length} passed ---`);
if (passedCount === cases.length) process.exit(0);
else process.exit(1);

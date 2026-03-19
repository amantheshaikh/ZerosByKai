import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase.from('roasts').select('roast_score');
if (error) {
    console.error(error);
} else {
    const scores = data.map(r => r.roast_score);
    const counts = {};
    scores.forEach(s => counts[s] = (counts[s] || 0) + 1);
    console.log('Score Distribution:', counts);
    console.log('Total Roasts:', scores.length);
}

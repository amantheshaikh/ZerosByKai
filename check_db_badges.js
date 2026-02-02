import { supabaseAdmin } from './backend/src/config/supabase.js';

async function checkUserBadges() {
    const { data: subscribers, error: subError } = await supabaseAdmin
        .from('subscribers')
        .select('email, user_id');

    if (subError) {
        console.error(subError);
        return;
    }

    console.log('--- User Badges ---');
    for (const sub of subscribers) {
        const { data: badges, error: badgeError } = await supabaseAdmin
            .from('user_badges')
            .select('*')
            .eq('user_id', sub.user_id);

        if (badgeError) {
            console.error(badgeError);
            continue;
        }

        console.log(`User: ${sub.email} (${sub.user_id})`);
        console.log(`Badges (${badges.length}):`, badges.map(b => `${b.idea_id} (${b.badge_type})`).join(', '));
    }
}

checkUserBadges();

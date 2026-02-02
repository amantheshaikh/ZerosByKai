
import { supabaseAdmin } from './src/config/supabase.js';

async function checkUser(email) {
    console.log(`Checking status for ${email}...`);

    try {
        const { data: subscriber, error } = await supabaseAdmin
            .from('subscribers')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('Subscriber record NOT FOUND.');
            } else {
                console.error('Error fetching subscriber:', error);
            }
            return;
        }

        console.log('Subscriber Record:');
        console.log(JSON.stringify(subscriber, null, 2));

        // Check auth.users too
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users.find(u => u.email === email);

        if (authUser) {
            console.log('\nAuth User Record:');
            console.log(JSON.stringify({
                id: authUser.id,
                email: authUser.email,
                created_at: authUser.created_at,
                last_sign_in_at: authUser.last_sign_in_at,
                user_metadata: authUser.user_metadata
            }, null, 2));
        } else {
            console.log('\nAuth User NOT FOUND.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

const email = process.argv[2] || 'amantheshaikh@gmail.com';
checkUser(email);

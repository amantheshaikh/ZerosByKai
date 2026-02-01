import { supabaseAdmin } from '../config/supabase.js';
import readline from 'readline';

/**
 * Script to delete all users from Supabase Auth.
 * 
 * Usage:
 * node src/scripts/delete-users.js           <- Dry run (default)
 * node src/scripts/delete-users.js --execute <- Actually delete users
 */

const isExecute = process.argv.includes('--execute');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function deleteAllUsers() {
    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin client not initialized. Check SUPABASE_SERVICE_KEY.');
        process.exit(1);
    }

    console.log('🔍 Fetching all users...');

    let allUsers = [];
    let page = 1;
    const perPage = 1000;

    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;
        allUsers = users;
    } catch (error) {
        console.error('❌ Error fetching users:', error.message);
        process.exit(1);
    }

    if (allUsers.length === 0) {
        console.log('✅ No users found to delete.');
        process.exit(0);
    }

    console.log(`📋 Found ${allUsers.length} users.`);

    if (!isExecute) {
        console.log('\n--- DRY RUN ---');
        allUsers.forEach(u => console.log(`- ${u.email} (${u.id})`));
        console.log('\n⚠️  To actually delete these users, run with --execute');
        process.exit(0);
    }

    // Double confirmation for safety
    console.log('\n' + '!'.repeat(50));
    console.log('⚠️  WARNING: PERMANENT DATA DELETION');
    console.log(`This will delete ALL ${allUsers.length} users and their data.`);
    console.log('!'.repeat(50) + '\n');

    rl.question('Are you ABSOLUTELY sure? Type "DELETE ALL USERS" to proceed: ', async (answer) => {
        if (answer !== 'DELETE ALL USERS') {
            console.log('❌ Confirmation failed. Aborting.');
            process.exit(0);
        }

        console.log('🚀 Starting deletion...');

        let successCount = 0;
        let failCount = 0;

        for (const user of allUsers) {
            try {
                const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                if (error) {
                    console.error(`  - Failed to delete ${user.email}:`, error.message);
                    failCount++;
                } else {
                    console.log(`  - Deleted ${user.email}`);
                    successCount++;
                }
            } catch (err) {
                console.error(`  - Error deleting ${user.email}:`, err.message);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(30));
        console.log(`✅ Deletion complete.`);
        console.log(`Total Success: ${successCount}`);
        console.log(`Total Failed: ${failCount}`);
        console.log('='.repeat(30));

        rl.close();
    });
}

deleteAllUsers();

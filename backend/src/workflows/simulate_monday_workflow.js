import { pickAndPublishIdeas, calculateWinner, sendWeeklyDigest } from '../jobs/weekly.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env if not already loaded
if (!process.env.RESEND_API_KEY) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.join(__dirname, '../../.env') });
}

/**
 * Simulate the complete Monday morning workflow
 * This runs the exact same sequence as the cron job:
 * 1. Pick 10 ideas from backlog
 * 2. Calculate last week's winner and award badges
 * 3. Send weekly digest emails to all subscribers
 */
async function simulateMondayWorkflow() {
    console.log('🚀 Starting Monday Workflow Simulation...');
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Pick and Publish ideas from backlog
    console.log('📝 STEP 1: Picking and publishing ideas from backlog...');
    try {
        await pickAndPublishIdeas();
        console.log('✅ Publishing completed\n');
    } catch (error) {
        console.error('❌ Error picking/publishing ideas:', error);
        console.log('');
    }

    // Step 2: Calculate winner from last week
    console.log('🏆 STEP 2: Calculating last week\'s winner...');
    try {
        const result = await calculateWinner();
        if (result) {
            console.log(`✅ Winner: ${result.winner.name}`);
            console.log(`   Badges awarded: ${result.badgeCount} users\n`);
        } else {
            console.log('ℹ️  No winner calculated (no ideas from last week)\n');
        }
    } catch (error) {
        console.error('❌ Error calculating winner:', error);
        console.log('');
    }

    // Step 3: Send weekly digest
    console.log('📧 STEP 3: Sending weekly digest emails...');
    try {
        const result = await sendWeeklyDigest();
        console.log(`✅ Emails sent: ${result.sent} subscribers`);
        console.log(`   Ideas included: ${result.ideas}\n`);
    } catch (error) {
        console.error('❌ Error sending weekly digest:', error);
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ Monday Workflow Simulation Complete!');
    console.log('');
    console.log('📬 Check your email to test the auto-login feature:');
    console.log('   1. Click "SEE ALL IDEAS & VOTE" button');
    console.log('   2. You should be automatically signed in');
    console.log('   3. Try voting immediately without additional login');
}

// Run the simulation
simulateMondayWorkflow()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

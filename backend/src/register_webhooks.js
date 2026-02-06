import { webhooksApi } from './config/brevo.js';
import { config } from './config/env.js';

async function registerWebhooks() {
    // Determine the production base URL (fallback to a placeholder)
    const productionUrl = "https://zerosbykai-api-prod.fly.dev";
    const webhookPath = "/api/webhooks/brevo";

    const secret = config.brevo.webhookSecret;

    if (!secret) {
        console.error("❌ BREVO_WEBHOOK_SECRET is not set in your environment.");
        console.log("Please add BREVO_WEBHOOK_SECRET=your_random_secret to your .env and Fly.io secrets first.");
        return;
    }

    const fullUrl = `${productionUrl}${webhookPath}?token=${secret}`;
    console.log(`🚀 Attempting to register Webhooks at: ${fullUrl}`);

    try {
        // 1. Check for existing webhooks to avoid duplicates
        const { body: existingWebhooks } = await webhooksApi.getWebhooks();
        const webhooks = existingWebhooks.webhooks || [];

        const marketingExists = webhooks.find(w => w.url === fullUrl && w.type === 'marketing');
        const transactionalExists = webhooks.find(w => w.url === fullUrl && w.type === 'transactional');

        // 2. Create Marketing Webhook (for contact_deleted and marketing unsubscribe)
        if (!marketingExists) {
            await webhooksApi.createWebhook({
                url: fullUrl,
                events: ["contact_deleted", "unsubscribe"],
                type: "marketing"
            });
            console.log("✅ Marketing Webhook created successfully!");
        } else {
            console.log("ℹ️ Marketing Webhook already exists.");
        }

        // 3. Create Transactional Webhook (for transactional 'unsubscribed' event)
        if (!transactionalExists) {
            await webhooksApi.createWebhook({
                url: fullUrl,
                events: ["unsubscribed"],
                type: "transactional"
            });
            console.log("✅ Transactional Webhook created successfully!");
        } else {
            console.log("ℹ️ Transactional Webhook already exists.");
        }

        console.log("\n✨ Webhook registration complete!");
    } catch (error) {
        const errorBody = error?.response?.body || error?.body || error.message;
        console.error("❌ Failed to register webhooks:", JSON.stringify(errorBody, null, 2));
    }
}

registerWebhooks();

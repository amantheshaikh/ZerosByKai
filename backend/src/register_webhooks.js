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
        let webhooks = [];
        try {
            const { body: existingWebhooks } = await webhooksApi.getWebhooks();
            console.log("Existing Webhooks Found.");
            webhooks = existingWebhooks.webhooks || [];
        } catch (e) {
            // Brevo returns 400 "Webhook record does not exist" if none found
            const errorStatus = e?.response?.status;
            const errorCode = e?.response?.data?.code || e?.response?.body?.code;
            if (errorStatus === 400 && errorCode === 'document_not_found') {
                console.log("ℹ️ No existing webhooks found (clean slate).");
            } else {
                throw e; // Real error
            }
        }

        const marketingExists = webhooks.find(w => w.url === fullUrl && w.type === 'marketing');
        const transactionalExists = webhooks.find(w => w.url === fullUrl && w.type === 'transactional');

        // 2. Create Marketing Webhook (for contact_deleted and marketing unsubscribe)
        // 2. Marketing Webhook
        const marketingEvents = ["contactDeleted", "unsubscribed"];
        if (!marketingExists) {
            await webhooksApi.createWebhook({
                url: fullUrl,
                events: marketingEvents,
                type: "marketing"
            });
            console.log("✅ Marketing Webhook created successfully!");
        } else {
            await webhooksApi.updateWebhook(marketingExists.id, {
                events: marketingEvents
            });
            console.log("✅ Marketing Webhook updated successfully!");
        }

        // 3. Transactional Webhook
        const transactionalEvents = ["unsubscribed"]; // Transactional uses 'unsubscribed'
        if (!transactionalExists) {
            await webhooksApi.createWebhook({
                url: fullUrl,
                events: transactionalEvents,
                type: "transactional"
            });
            console.log("✅ Transactional Webhook created successfully!");
        }

        console.log("\n✨ Webhook registration complete!");
    } catch (error) {
        console.error("❌ Failed to register webhooks:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Keys:", Object.keys(error.response));
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Body:", JSON.stringify(error.response.body, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

registerWebhooks();

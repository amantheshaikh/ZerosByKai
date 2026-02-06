import brevo from '@getbrevo/brevo';
import { config } from './env.js';

// Configure defaults
// Configure API key
// Fail-soft validation
if (!config.brevo.apiKey || !config.brevo.apiKey.trim()) {
    console.error('⚠️  WARNING: BREVO_API_KEY is missing. Email features will be disabled.');
}

// Configure API key
const transactionalEmailsApi = new brevo.TransactionalEmailsApi();
transactionalEmailsApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

const contactsApi = new brevo.ContactsApi();
contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.brevo.apiKey);

const webhooksApi = new brevo.WebhooksApi();
webhooksApi.setApiKey(brevo.WebhooksApiApiKeys.apiKey, config.brevo.apiKey);

export {
    transactionalEmailsApi as brevoClient,
    contactsApi,
    webhooksApi
};

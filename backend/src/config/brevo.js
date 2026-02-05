import brevo from '@getbrevo/brevo';
import { config } from './env.js';

// Configure defaults
// Configure API key
// Fail-fast validation
if (!config.brevo.apiKey || !config.brevo.apiKey.trim()) {
    console.error('❌ FATAL ERROR: BREVO_API_KEY is missing or empty in environment variables.');
    process.exit(1);
}

// Configure API key
const transactionalEmailsApi = new brevo.TransactionalEmailsApi();
transactionalEmailsApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

const contactsApi = new brevo.ContactsApi();
contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.brevo.apiKey);

export {
    transactionalEmailsApi as brevoClient,
    contactsApi
};

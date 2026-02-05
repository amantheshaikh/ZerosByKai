import { contactsApi } from "../config/brevo.js";
import { maskEmail } from "../utils/helpers.js";

/**
 * Syncs a user to Brevo Contacts.
 * Upserts: Creates if new, Updates if existing.
 * 
 * @param {Object} user 
 * @param {string} user.email 
 * @param {string} [user.name] 
 * @param {Object} [attributes] - Key-value pair of custom attributes (e.g., { PLAN: 'Pro' })
 */
export async function syncContact(user, attributes = {}) {
    // Early guard for validation
    if (!user || !user.email || typeof user.email !== 'string' || !user.email.trim()) {
        throw new Error('syncContact: missing required user.email');
    }

    try {
        const { email, name } = user;

        const contactAttributes = { ...attributes };
        if (name) {
            // Split name into first/last for better segmentation if simple logic works, 
            // otherwise just store as NAME if you have that attribute. 
            // Standard Brevo attributes are FIRSTNAME / LASTNAME commonly.
            // Using NAME custom attribute for simplicity or splitting:
            const parts = name.split(' ');
            contactAttributes.FIRSTNAME = parts[0];
            if (parts.length > 1) contactAttributes.LASTNAME = parts.slice(1).join(' ');
        }

        const createContact = {
            email: email,
            attributes: contactAttributes,
            updateEnabled: true, // Auto-update if exists
            listIds: [config.brevo.listId || 2] // List ID from Environment/Dashboard
        };

        await contactsApi.createContact(createContact);
        console.log(`✅ Synced contact to Brevo: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        // Log but don't crash main flow
        console.error('⚠️ Failed to sync contact to Brevo:', error?.body || error.message);
        return false;
    }
}

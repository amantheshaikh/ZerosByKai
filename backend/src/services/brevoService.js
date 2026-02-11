import { contactsApi } from "../config/brevo.js";
import { config } from "../config/env.js";
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
        const errorBody = error?.response?.body || error?.body || error.message;
        console.error('⚠️ Failed to sync contact to Brevo:', JSON.stringify(errorBody, null, 2));
        return false;
    }
}

/**
 * Marks a contact as blocklisted (unsubscribed) in Brevo.
 * 
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function blocklistContact(email) {
    if (!email || typeof email !== 'string' || !email.trim()) {
        throw new Error('blocklistContact: missing required email');
    }

    try {
        await contactsApi.updateContact(email, { emailBlacklisted: true });
        console.log(`🚫 Blocklisted contact in Brevo: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        // 404 means the contact doesn't exist in Brevo, which is fine since they're unsubscribing
        if (error?.response?.status === 404 || error?.status === 404) {
            console.log(`ℹ️  Contact ${maskEmail(email)} not found in Brevo, no need to blocklist.`);
            return true;
        }

        const errorBody = error?.response?.body || error?.body || error.message;
        console.error('⚠️ Failed to blocklist contact in Brevo:', JSON.stringify(errorBody, null, 2));
        return false;
    }
}

/**
 * Removes blocklist (unsubscribe) flag from a Brevo contact.
 * Used when a previously unsubscribed user re-subscribes.
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function unblockContact(email) {
    if (!email || typeof email !== 'string' || !email.trim()) {
        throw new Error('unblockContact: missing required email');
    }

    try {
        await contactsApi.updateContact(email, { emailBlacklisted: false });
        console.log(`✅ Unblocked contact in Brevo: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        if (error?.response?.status === 404 || error?.status === 404) {
            console.log(`ℹ️ Contact ${maskEmail(email)} not found in Brevo, skipping unblock.`);
            return true;
        }
        const errorBody = error?.response?.body || error?.body || error.message;
        console.error('⚠️ Failed to unblock contact in Brevo:', JSON.stringify(errorBody, null, 2));
        return false;
    }
}

/**
 * Deletes a contact from Brevo.
 * 
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function deleteContact(email) {
    if (!email || typeof email !== 'string' || !email.trim()) {
        throw new Error('deleteContact: missing required email');
    }

    try {
        await contactsApi.deleteContact(email);
        console.log(`🗑️ Deleted contact from Brevo: ${maskEmail(email)}`);
        return true;
    } catch (error) {
        // 404 is fine, means already deleted
        if (error?.response?.status === 404 || error?.status === 404) {
            console.log(`ℹ️ Contact ${maskEmail(email)} already deleted or not found in Brevo.`);
            return true;
        }
        const errorBody = error?.response?.body || error?.body || error.message;
        console.error('⚠️ Failed to delete contact from Brevo:', JSON.stringify(errorBody, null, 2));
        return false;
    }
}

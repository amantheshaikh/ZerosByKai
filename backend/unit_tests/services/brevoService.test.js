import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncContact, blocklistContact, deleteContact } from '../../src/services/brevoService.js';
import { contactsApi } from '../../src/config/brevo.js';

// Mock Brevo config and API
vi.mock('../../src/config/brevo.js', () => ({
    contactsApi: {
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn()
    }
}));

vi.mock('../../src/config/env.js', () => ({
    config: {
        brevo: {
            apiKey: 'mock-key',
            listId: 2
        }
    }
}));

vi.mock('../../src/utils/helpers.js', () => ({
    maskEmail: vi.fn((email) => email)
}));

describe('brevoService.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('syncContact()', () => {
        it('should sync contact to Brevo', async () => {
            contactsApi.createContact.mockResolvedValue({ body: {} });

            const result = await syncContact({ email: 'test@example.com', name: 'Test User' });

            expect(result).toBe(true);
            expect(contactsApi.createContact).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com'
            }));
        });

        it('should handle errors gracefully', async () => {
            contactsApi.createContact.mockRejectedValue(new Error('Brevo Error'));

            const result = await syncContact({ email: 'test@example.com' });

            expect(result).toBe(false);
        });
    });

    describe('blocklistContact()', () => {
        it('should blocklist contact in Brevo', async () => {
            contactsApi.updateContact.mockResolvedValue({ body: {} });

            const result = await blocklistContact('test@example.com');

            expect(result).toBe(true);
            expect(contactsApi.updateContact).toHaveBeenCalledWith('test@example.com', { emailBlacklisted: true });
        });

        it('should return true if contact is not found (404)', async () => {
            const error = new Error('Not Found');
            error.status = 404;
            contactsApi.updateContact.mockRejectedValue(error);

            const result = await blocklistContact('test@example.com');

            expect(result).toBe(true);
            expect(contactsApi.updateContact).toHaveBeenCalled();
        });

        it('should handle other errors and return false', async () => {
            contactsApi.updateContact.mockRejectedValue(new Error('API Error'));

            const result = await blocklistContact('test@example.com');

            expect(result).toBe(false);
        });
    });

    describe('deleteContact()', () => {
        it('should delete contact from Brevo', async () => {
            contactsApi.deleteContact.mockResolvedValue({ body: {} });

            const result = await deleteContact('test@example.com');

            expect(result).toBe(true);
            expect(contactsApi.deleteContact).toHaveBeenCalledWith('test@example.com');
        });

        it('should return true if contact is already deleted (404)', async () => {
            const error = new Error('Not Found');
            error.status = 404;
            contactsApi.deleteContact.mockRejectedValue(error);

            const result = await deleteContact('test@example.com');

            expect(result).toBe(true);
        });

        it('should handle other errors and return false', async () => {
            contactsApi.deleteContact.mockRejectedValue(new Error('API Error'));

            const result = await deleteContact('test@example.com');

            expect(result).toBe(false);
        });
    });
});

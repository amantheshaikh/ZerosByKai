import { vi } from 'vitest';

/**
 * A robust, chainable Supabase mock for unit tests.
 * This mock supports fluent chaining (e.g., supabase.from().select().eq().single())
 * and includes a dedicated auth mock.
 */

const createMockClient = () => {
    const mock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        auth: {
            getUser: vi.fn(),
            signOut: vi.fn(),
            verifyOtp: vi.fn(),
            admin: {
                generateLink: vi.fn(),
                createSession: vi.fn(),
                deleteUser: vi.fn()
            }
        },
        // To handle the thenable nature of supabase calls in some contexts
        then: vi.fn(function (resolve) {
            return Promise.resolve({ data: null, error: null }).then(resolve);
        })
    };

    return mock;
};

export const supabase = createMockClient();
export const supabaseAdmin = createMockClient();

/**
 * Resets all mocks on both standard and admin clients.
 * This should be called in beforeEach or afterEach.
 */
export const resetSupabaseMocks = () => {
    const reset = (m) => {
        // Clear all calls on the mock itself and its properties
        Object.keys(m).forEach(key => {
            if (m[key] && typeof m[key] === 'function' && m[key].mock) {
                m[key].mockClear();
            }
        });
        // Clear auth nested mocks
        if (m.auth) {
            Object.keys(m.auth).forEach(key => {
                if (m.auth[key] && typeof m.auth[key] === 'function' && m.auth[key].mock) {
                    m.auth[key].mockClear();
                }
            });
            if (m.auth.admin) {
                Object.keys(m.auth.admin).forEach(key => {
                    if (m.auth.admin[key] && typeof m.auth.admin[key] === 'function' && m.auth.admin[key].mock) {
                        m.auth.admin[key].mockClear();
                    }
                });
            }
        }
    };
    reset(supabase);
    reset(supabaseAdmin);
};

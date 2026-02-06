import { vi } from 'vitest';

/**
 * A robust Supabase mock that handles chaining by always returning itself
 * for fluent methods, while allowing specific methods like maybeSingle() 
 * to return custom data.
 */
const mock = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

// chaining helper
const setupChains = () => {
    ['from', 'select', 'eq', 'in', 'order', 'limit', 'insert', 'update', 'delete'].forEach(method => {
        mock[method].mockImplementation(() => mock);
    });
};

setupChains();

export const mockSupabase = mock;
export const resetSupabaseMock = () => {
    vi.clearAllMocks();
    setupChains();
};

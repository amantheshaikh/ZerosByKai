import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pickAndPublishIdeas } from '../../src/services/newsletterService.js';
import { supabaseAdmin } from '../../src/config/supabase.js';

vi.mock('../../src/config/supabase.js', () => {
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
    };

    // Default implementation returns the same instance for chaining
    Object.values(mock).forEach(m => m.mockImplementation(() => mock));

    return { supabaseAdmin: mock };
});

vi.mock('../../src/utils/dateUtils.js', () => ({
    getMonday: vi.fn(() => '2026-02-02')
}));

describe('newsletterService.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Ensure chaining is set up for every method
        const client = supabaseAdmin;
        const methods = ['from', 'select', 'eq', 'in', 'order', 'limit', 'insert', 'update', 'single', 'maybeSingle'];
        methods.forEach(method => {
            if (client[method] && typeof client[method].mockImplementation === 'function') {
                client[method].mockImplementation(() => client);
            }
        });
    });

    describe('pickAndPublishIdeas()', () => {
        it('should skip if batch already exists with ideas', async () => {
            const mockWeekStart = '2026-02-02';
            // .from().select().eq().maybeSingle()
            supabaseAdmin.maybeSingle.mockResolvedValue({
                data: { id: 1, week_start_date: mockWeekStart, total_ideas: 10 },
                error: null
            });

            const result = await pickAndPublishIdeas();

            expect(result).toEqual({ id: 1, week_start_date: mockWeekStart, total_ideas: 10 });
        });

        it('should create a batch and publish ideas if no batch exists', async () => {
            const mockWeekStart = '2026-02-02';
            const mockBatchId = 123;
            const mockIdeas = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Idea ${i + 1}` }));

            // 1. check current batch (Chain 1)
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            // 2. create batch (Chain 2: .from.insert.select.single)
            supabaseAdmin.single.mockResolvedValueOnce({
                data: { id: mockBatchId, week_start_date: mockWeekStart, total_ideas: 0 },
                error: null
            });

            // 3. fetch backlog ideas (Chain 3: .from.select.eq.order.limit)
            supabaseAdmin.limit.mockResolvedValueOnce({ data: mockIdeas, error: null });

            // 4. finalize publishing (Chain 4: .from.update.in.select)
            // select is the last method here. 
            // Previous selects were in Chains 1, 2, and 3, but they were not terminal.
            // But we already mocked Chain 3's limit.
            // However, CHAIN 4's select is the 4th call to select overall if we follow the code.
            // Wait, Chains 1, 2, 3 all call select() as an intermediate.
            // So select() will be called 4 times in this test.
            supabaseAdmin.select
                .mockReturnValueOnce(supabaseAdmin) // Chain 1
                .mockReturnValueOnce(supabaseAdmin) // Chain 2
                .mockReturnValueOnce(supabaseAdmin) // Chain 3
                .mockResolvedValueOnce({ // Chain 4 TERMINAL
                    data: mockIdeas.map(id => ({ ...id, status: 'scheduled', week_published: mockWeekStart })),
                    error: null
                });

            // 5. update batch metrics (Chain 5: .from.update.eq)
            // eq is the last method here.
            // Previous eqs were in Chains 1 and 3, but they were intermediate.
            supabaseAdmin.eq
                .mockReturnValueOnce(supabaseAdmin) // Chain 1
                .mockReturnValueOnce(supabaseAdmin) // Chain 3
                .mockResolvedValueOnce({ error: null }); // Chain 5 TERMINAL

            const result = await pickAndPublishIdeas();

            expect(result).toHaveLength(10);
            expect(result[0].status).toBe('scheduled');
        });

        it('should throw an error if fewer than 10 approved ideas are found', async () => {
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({
                data: { id: 1, week_start_date: '2026-02-02', total_ideas: 0 },
                error: null
            });

            // Intermediate steps use default return client (already handled by beforeEach)

            // fetch backlog ideas: .from.select.eq.order.limit(10)
            supabaseAdmin.limit.mockResolvedValueOnce({
                data: Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })),
                error: null
            });

            await expect(pickAndPublishIdeas()).rejects.toThrow(/Only 5 approved ideas found/);
        });

        it('should handle database errors when creating a batch', async () => {
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            // Chain 2: .from.insert.select.single()
            supabaseAdmin.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'DB Error' }
            });

            await expect(pickAndPublishIdeas()).rejects.toThrow('Failed to create batch: DB Error');
        });

        it('should handle update errors when publishing ideas', async () => {
            supabaseAdmin.maybeSingle.mockResolvedValueOnce({ data: { id: 1, total_ideas: 0 }, error: null });

            // fetch backlog: .from.select.eq.order.limit(10)
            supabaseAdmin.limit.mockResolvedValueOnce({
                data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
                error: null
            });

            // Chain 4: .from.update.in.select()
            // Intermediate select for Chain 1 and Chain 3
            supabaseAdmin.select
                .mockReturnValueOnce(supabaseAdmin) // Chain 1
                .mockReturnValueOnce(supabaseAdmin) // Chain 3
                .mockResolvedValueOnce({ // Chain 4 TERMINAL
                    data: null,
                    error: { message: 'Update Failed' }
                });

            await expect(pickAndPublishIdeas()).rejects.toThrow('Failed to publish ideas: Update Failed');
        });
    });
});

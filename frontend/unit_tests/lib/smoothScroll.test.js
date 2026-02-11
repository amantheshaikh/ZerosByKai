import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmoothScrollProvider } from '../../lib/smoothScroll';
import { useRouter } from 'next/router';
import Lenis from 'lenis';

// Override the global mock so we get the REAL SmoothScrollProvider
vi.mock('@/lib/smoothScroll', async () => await vi.importActual('../../lib/smoothScroll'));

// Mock dependencies
vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));

vi.mock('lenis', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            scrollTo: vi.fn(),
            on: vi.fn(),
            raf: vi.fn(),
            destroy: vi.fn(),
        })),
    };
});

describe('SmoothScrollProvider', () => {
    const mockScrollTo = vi.fn();
    const mockWindowScrollTo = vi.fn();
    let rafCallbacks = [];

    beforeEach(() => {
        vi.clearAllMocks();
        rafCallbacks = [];

        // Mock Lenis instance
        Lenis.mockImplementation(() => ({
            scrollTo: mockScrollTo,
            on: vi.fn(),
            raf: vi.fn(),
            destroy: vi.fn(),
        }));

        // Mock browser APIs needed by SmoothScrollProvider
        global.window.scrollTo = mockWindowScrollTo;
        global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });
        // Capture rAF callbacks without auto-executing to avoid infinite loop
        global.requestAnimationFrame = vi.fn((cb) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });
        global.cancelAnimationFrame = vi.fn();
    });

    it('resets scroll position on route change', () => {
        const mockRouter = {
            pathname: '/',
            events: { on: vi.fn(), off: vi.fn() },
        };
        useRouter.mockReturnValue(mockRouter);

        const { rerender } = render(
            <SmoothScrollProvider>
                <div>Test</div>
            </SmoothScrollProvider>
        );

        // Flush one rAF tick so Lenis init effect's loop starts
        if (rafCallbacks.length > 0) rafCallbacks[0](performance.now());

        // Simulate route change
        useRouter.mockReturnValue({
            pathname: '/new-page',
            events: { on: vi.fn(), off: vi.fn() },
        });

        rerender(
            <SmoothScrollProvider>
                <div>Test</div>
            </SmoothScrollProvider>
        );

        expect(mockScrollTo).toHaveBeenCalledWith(0, { immediate: true });
        expect(mockWindowScrollTo).toHaveBeenCalledWith(0, 0);
    });
});

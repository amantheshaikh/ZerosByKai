import { render, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrollToTop from '../../components/ScrollToTop';
import * as smoothScroll from '@/lib/smoothScroll';

vi.mock('@/lib/smoothScroll', () => ({
    useScrollActions: vi.fn(),
}));

// Mock handled in setup: framer-motion

describe('ScrollToTop', () => {
    const mockScrollToTop = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(smoothScroll, 'useScrollActions').mockReturnValue({
            scrollToTop: mockScrollToTop,
        });
        window.scrollY = 0;
    });

    afterEach(cleanup);

    it('is hidden initially', () => {
        const { container } = render(<ScrollToTop />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows button when scrolled down > 300px', async () => {
        const { container } = render(<ScrollToTop />);
        const view = within(container);

        window.scrollY = 350;
        fireEvent.scroll(window);

        await waitFor(() => {
            expect(view.getByLabelText(/Scroll to top/i)).toBeTruthy();
        });
    });

    it('hides button when scrolled up < 300px', async () => {
        const { container } = render(<ScrollToTop />);
        const view = within(container);

        window.scrollY = 350;
        fireEvent.scroll(window);
        await waitFor(() => {
            expect(view.getByLabelText(/Scroll to top/i)).toBeTruthy();
        });

        window.scrollY = 100;
        fireEvent.scroll(window);
        await waitFor(() => {
            expect(view.queryByLabelText(/Scroll to top/i)).toBeNull();
        });
    });

    it('calls scrollToTop action when clicked', async () => {
        const { container } = render(<ScrollToTop />);
        const view = within(container);

        window.scrollY = 350;
        fireEvent.scroll(window);
        await waitFor(() => {
            expect(view.getByLabelText(/Scroll to top/i)).toBeTruthy();
        });

        fireEvent.click(view.getByLabelText(/Scroll to top/i));
        expect(mockScrollToTop).toHaveBeenCalledWith({ duration: 1.5 });
    });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollToTop from '../../components/ScrollToTop';
import * as smoothScroll from '@/lib/smoothScroll';

// Mock lib/smoothScroll
vi.mock('@/lib/smoothScroll', () => ({
    useScrollActions: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('ScrollToTop', () => {
    const mockScrollToTop = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(smoothScroll, 'useScrollActions').mockReturnValue({
            scrollToTop: mockScrollToTop,
        });

        // Reset scroll position
        window.scrollY = 0;
    });

    it('is hidden initially', () => {
        const { container } = render(<ScrollToTop />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows button when scrolled down > 300px', async () => {
        render(<ScrollToTop />);

        // Simulate scroll
        window.scrollY = 350;
        fireEvent.scroll(window);

        await waitFor(() => {
            expect(screen.getByLabelText(/Scroll to top/i)).toBeInTheDocument();
        });
    });

    it('hides button when scrolled up < 300px', async () => {
        render(<ScrollToTop />);

        // Show first
        window.scrollY = 350;
        fireEvent.scroll(window);
        await waitFor(() => {
            expect(screen.getByLabelText(/Scroll to top/i)).toBeInTheDocument();
        });

        // Hide
        window.scrollY = 100;
        fireEvent.scroll(window);
        await waitFor(() => {
            const button = screen.queryByLabelText(/Scroll to top/i);
            expect(button).not.toBeInTheDocument();
        });
    });

    it('calls scrollToTop action when clicked', async () => {
        render(<ScrollToTop />);

        // Show button
        window.scrollY = 350;
        fireEvent.scroll(window);
        await waitFor(() => {
            expect(screen.getByLabelText(/Scroll to top/i)).toBeInTheDocument();
        });

        // Click
        fireEvent.click(screen.getByLabelText(/Scroll to top/i));

        expect(mockScrollToTop).toHaveBeenCalledWith({ duration: 1.5 });
    });
});

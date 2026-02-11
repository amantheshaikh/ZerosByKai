import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FeedbackModal from '@/components/FeedbackModal';
import { useAuth, apiFetch } from '@/lib/auth';
import { useRouter } from 'next/router';
import { renderWithProviders } from '../utils/renderWithProviders';

// Mock dependencies
// Mock lib/auth is handled by renderWithProviders

vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));

describe('FeedbackModal', () => {
    const mockUser = { email: 'test@example.com' };
    const mockRouter = {
        asPath: '/test-page',
        events: {
            on: vi.fn(),
            off: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useRouter.mockReturnValue(mockRouter);
    });

    it('renders nothing when slowFeedbackModal is false', () => {
        const { container } = renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: false }
        });
        expect(container.firstChild).toBeNull();
    });

    it('renders the form when showFeedbackModal is true', () => {
        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true }
        });

        expect(screen.getByText('FEEDBACK LOOP')).toBeDefined();
        // Default color is 'love'
        expect(screen.getByPlaceholderText(/Tell Kai what worked/i)).toBeDefined();
    });

    it('validates email format if provided', async () => {
        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true, user: null }
        });

        // Fill message (default 'love')
        fireEvent.change(screen.getByPlaceholderText(/Tell Kai what worked/i), {
            target: { value: 'This is some feedback' },
        });

        // Fill invalid email
        fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
            target: { value: 'invalid-email' },
        });

        // Submit
        fireEvent.click(screen.getByText('TRANSMIT FEEDBACK'));

        await waitFor(() => {
            expect(screen.getByText(/That email looks fake/i)).toBeDefined();
        });

        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('allows submission with no email for guests', async () => {
        apiFetch.mockResolvedValue({ success: true });

        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true, user: null }
        });

        fireEvent.change(screen.getByPlaceholderText(/Tell Kai what worked/i), {
            target: { value: 'Anonymous feedback' },
        });

        fireEvent.click(screen.getByText('TRANSMIT FEEDBACK'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
                body: expect.stringContaining('"email":null'),
            }));
            expect(screen.getByText('RECEIVED.')).toBeDefined();
        });
    });

    it('pre-fills authenticated user email and submits successfully', async () => {
        apiFetch.mockResolvedValue({ success: true });

        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true, user: mockUser }
        });

        // Textarea placeholder should change based on default 'love' type
        fireEvent.change(screen.getByPlaceholderText(/Tell Kai what worked/i), {
            target: { value: 'I love this site!' },
        });

        // Email field shouldn't even be rendered for logged in users in the current UI logic
        expect(screen.queryByPlaceholderText('your@email.com')).toBeNull();

        fireEvent.click(screen.getByText('TRANSMIT FEEDBACK'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
                body: expect.stringContaining('"email":"test@example.com"'),
            }));
            expect(screen.getByText('RECEIVED.')).toBeDefined();
        });
    });

    it('changes feedback type correctly', () => {
        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true, user: null }
        });

        // Click 'BRAIN BLAST' (idea)
        fireEvent.click(screen.getByText('BRAIN BLAST'));
        expect(screen.getByPlaceholderText(/A feature I missed/i)).toBeDefined();

        // Click 'ROAST KAI' (hate)
        fireEvent.click(screen.getByText('ROAST KAI'));
        expect(screen.getByPlaceholderText(/What's broken/i)).toBeDefined();

        // Click 'GLITCH IN MATRIX' (bug)
        fireEvent.click(screen.getByText('GLITCH IN MATRIX'));
        expect(screen.getByPlaceholderText(/Describe the glitch/i)).toBeDefined();
    });

    it('closes when clicking close button', () => {
        const closeFeedbackModal = vi.fn();
        renderWithProviders(<FeedbackModal />, {
            initialAuthState: { showFeedbackModal: true, closeFeedbackModal }
        });

        const closeBtn = screen.getByRole('button', { name: /Close modal/i }); // The X button
        fireEvent.click(closeBtn);

        expect(closeFeedbackModal).toHaveBeenCalled();
    });
});

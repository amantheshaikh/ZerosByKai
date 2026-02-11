import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KaiStory from '../../pages/story';
import { useAuth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
}));

// Mocks handled in setup: framer-motion, next/image, next/link

describe('KaiStory Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock: unauthenticated
        useAuth.mockReturnValue({
            user: null,
            profile: null,
            subscribeNewsletter: vi.fn(),
        });
    });

    it('renders the subscription form for unauthenticated users', () => {
        render(<KaiStory />);
        expect(screen.getAllByText(/GET THE WEEKLY ZEROS/i)[0]).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText(/your@email.com/i)[0]).toBeInTheDocument();
    });

    it('renders "YOU\'RE ALREADY IN" for authenticated subscribed users', () => {
        useAuth.mockReturnValue({
            user: { user_metadata: { name: 'Kai' } },
            profile: { unsubscribed_at: null },
            subscribeNewsletter: vi.fn(),
            showSubscribeModal: false,
        });

        render(<KaiStory />);
        expect(screen.getByText(/YOU'RE ALREADY IN, KAI!/i)).toBeInTheDocument();
        const inputs = screen.queryAllByPlaceholderText(/your@email.com/i);
        expect(inputs.length).toBe(0);
    });

    it('renders subscription form for authenticated but unsubscribed users', () => {
        useAuth.mockReturnValue({
            user: { email: 'test@example.com' },
            profile: { unsubscribed_at: new Date().toISOString() },
            subscribeNewsletter: vi.fn(),
        });

        render(<KaiStory />);

        // Should verify email is pre-filled
        const emailInput = screen.getAllByDisplayValue('test@example.com')[0];
        expect(emailInput).toBeInTheDocument();
        expect(screen.getAllByText(/GET THE WEEKLY ZEROS/i)[0]).toBeInTheDocument();
    });

    it('shows branded error for invalid email on submit', async () => {
        render(<KaiStory />);

        const emailInput = screen.getAllByPlaceholderText(/your@email.com/i)[0];
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        const submitButton = screen.getAllByText(/SUBSCRIBE FREE/i)[0];
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Kai needs a real email to transmit data/i)).toBeInTheDocument();
        });
    });

    it('handles subscription submission', async () => {
        const mockSubscribe = vi.fn().mockResolvedValue({});
        useAuth.mockReturnValue({
            user: null,
            profile: null,
            subscribeNewsletter: mockSubscribe,
        });

        render(<KaiStory />);

        const emailInput = screen.getAllByPlaceholderText(/your@email.com/i)[0];
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

        const submitButton = screen.getAllByText(/SUBSCRIBE FREE/i)[0];
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSubscribe).toHaveBeenCalledWith('new@example.com');
            expect(screen.getAllByText(/YOU'RE IN!/i)[0]).toBeInTheDocument();
        });
    });

    it('handles resubscription using user email without re-typing', async () => {
        const mockSubscribe = vi.fn().mockResolvedValue({});
        useAuth.mockReturnValue({
            user: { email: 'stored@example.com' },
            profile: { unsubscribed_at: new Date().toISOString() },
            subscribeNewsletter: mockSubscribe,
        });

        render(<KaiStory />);

        // Wait for render and click subscribe without typing
        await waitFor(() => {
            const submitButton = screen.getAllByText(/SUBSCRIBE FREE/i)[0];
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(mockSubscribe).toHaveBeenCalledWith('stored@example.com');
        });
    });
});

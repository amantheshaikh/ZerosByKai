
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubscribeModal from '../../components/SubscribeModal';
import { useAuth } from '@/lib/auth';

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('SubscribeModal', () => {
    const mockCloseSubscribeModal = vi.fn();
    const mockSubscribeNewsletter = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            showSubscribeModal: true,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
        });
    });

    it('renders correctly when open', () => {
        render(<SubscribeModal />);

        expect(screen.getByText(/GET THE WEEKLY DROP/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
        expect(screen.getByText(/SUBSCRIBE FREE/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        useAuth.mockReturnValue({
            showSubscribeModal: false,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
        });

        const { container } = render(<SubscribeModal />);
        expect(container).toBeEmptyDOMElement();
    });

    it('validates email before submitting', async () => {
        render(<SubscribeModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /SUBSCRIBE FREE/i });

        // Invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        expect(submitButton).toBeDisabled();

        // Valid email
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(submitButton).not.toBeDisabled();
    });

    it('calls subscribeNewsletter on valid submission', async () => {
        mockSubscribeNewsletter.mockResolvedValue({});

        render(<SubscribeModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /SUBSCRIBE FREE/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSubscribeNewsletter).toHaveBeenCalledWith('test@example.com');
        });
    });

    it('shows success message on successful subscription', async () => {
        mockSubscribeNewsletter.mockResolvedValue({});

        render(<SubscribeModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /SUBSCRIBE FREE/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/YOU'RE ON THE LIST!/i)).toBeInTheDocument();
        });
    });

    it('shows error message on subscription failure', async () => {
        mockSubscribeNewsletter.mockRejectedValue(new Error('Subscription failed'));

        render(<SubscribeModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /SUBSCRIBE FREE/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Subscription failed')).toBeInTheDocument();
        });
    });

    it('closes modal when close button is clicked (success state)', async () => {
        // Setup success state directly? No, easier to go through flow or just test behavior
        // Let's go through flow
        mockSubscribeNewsletter.mockResolvedValue({});

        render(<SubscribeModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /SUBSCRIBE FREE/i }));

        await waitFor(() => {
            expect(screen.getByText(/YOU'RE ON THE LIST!/i)).toBeInTheDocument();
        });

        const closeButton = screen.getByText('AWESOME');
        fireEvent.click(closeButton);

        expect(mockCloseSubscribeModal).toHaveBeenCalled();
    });

    it('opens auth modal when "Create an account" link is clicked', () => {
        const mockOpenAuthModal = vi.fn();
        useAuth.mockReturnValue({
            showSubscribeModal: true,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
            openAuthModal: mockOpenAuthModal,
        });

        render(<SubscribeModal />);

        const createAccountLink = screen.getByText(/Create an account/i);
        fireEvent.click(createAccountLink);

        expect(mockCloseSubscribeModal).toHaveBeenCalled();
        expect(mockOpenAuthModal).toHaveBeenCalledWith('signin');
    });
});

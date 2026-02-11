import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SubscribeModal from '../../components/SubscribeModal';
import { useAuth } from '@/lib/auth';
import { renderWithProviders } from '../utils/renderWithProviders';

// Mock lib/auth is handled by renderWithProviders

// Mock next/router
vi.mock('next/router', () => ({
    useRouter: vi.fn(() => ({
        events: { on: vi.fn(), off: vi.fn() },
    })),
}));

describe('SubscribeModal', () => {
    const getFirstByText = (text) => screen.getAllByText(text)[0];
    const getFirstByPlaceholder = (text) => screen.getAllByPlaceholderText(text)[0];
    const getFirstByDisplayValue = (val) => screen.getAllByDisplayValue(val)[0];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders correctly when open', () => {
        renderWithProviders(<SubscribeModal />, { initialAuthState: { showSubscribeModal: true } });

        expect(getFirstByText(/GET THE WEEKLY DROP/i)).toBeInTheDocument();
        expect(getFirstByPlaceholder(/your@email.com/i)).toBeInTheDocument();
        expect(getFirstByText(/SUBSCRIBE FREE/i)).toBeInTheDocument();
    });

    it('pre-fills email if user is logged in', () => {
        renderWithProviders(<SubscribeModal />, {
            initialAuthState: { showSubscribeModal: true, user: { email: 'test@example.com' } }
        });
        expect(getFirstByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        const { container } = renderWithProviders(<SubscribeModal />, { initialAuthState: { showSubscribeModal: false } });
        expect(container).toBeEmptyDOMElement();
    });

    it('shows branded error for invalid email on submit', async () => {
        renderWithProviders(<SubscribeModal />, { initialAuthState: { showSubscribeModal: true } });

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'not-an-email' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');

        // Button should NOT be disabled
        expect(submitButton).not.toBeDisabled();

        // Try to submit
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Kai needs a real email to transmit data/i)).toBeInTheDocument();
        });
    });

    it('enables submit button for valid email', () => {
        renderWithProviders(<SubscribeModal />, { initialAuthState: { showSubscribeModal: true } });

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'valid@email.com' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');
        expect(submitButton).not.toBeDisabled();
    });

    it('shows success state after successful subscription', async () => {
        const subscribeNewsletter = vi.fn().mockResolvedValue({});
        renderWithProviders(<SubscribeModal />, {
            initialAuthState: { showSubscribeModal: true, subscribeNewsletter }
        });

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(getFirstByText(/YOU'RE ON THE LIST/i)).toBeInTheDocument();
        });
        expect(subscribeNewsletter).toHaveBeenCalledWith('test@example.com');
    });

    it('shows error message on failed subscription', async () => {
        const subscribeNewsletter = vi.fn().mockRejectedValue(new Error('Subscription failed'));
        renderWithProviders(<SubscribeModal />, {
            initialAuthState: { showSubscribeModal: true, subscribeNewsletter }
        });

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Subscription failed/i)).toBeInTheDocument();
        });
    });

    it('opens auth modal when "Create an account" is clicked', () => {
        const closeSubscribeModal = vi.fn();
        const openAuthModal = vi.fn();
        renderWithProviders(<SubscribeModal />, {
            initialAuthState: { showSubscribeModal: true, closeSubscribeModal, openAuthModal }
        });

        fireEvent.click(getFirstByText(/Create an account/i));

        expect(closeSubscribeModal).toHaveBeenCalled();
        expect(openAuthModal).toHaveBeenCalledWith('signin');
    });

    it('calls closeSubscribeModal when close button is clicked', () => {
        const closeSubscribeModal = vi.fn();
        renderWithProviders(<SubscribeModal />, {
            initialAuthState: { showSubscribeModal: true, closeSubscribeModal }
        });
        const closeBtn = screen.getByRole('button', { name: /Close modal/i });
        fireEvent.click(closeBtn);
        expect(closeSubscribeModal).toHaveBeenCalled();
    });
});

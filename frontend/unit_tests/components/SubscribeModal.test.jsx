import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SubscribeModal from '../../components/SubscribeModal';
import { useAuth } from '@/lib/auth';

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock next/router
vi.mock('next/router', () => ({
    useRouter: vi.fn(() => ({
        events: { on: vi.fn(), off: vi.fn() },
    })),
}));

// Mock handled in setup: framer-motion

describe('SubscribeModal', () => {
    const mockCloseSubscribeModal = vi.fn();
    const mockSubscribeNewsletter = vi.fn();
    const mockOpenAuthModal = vi.fn();

    const getFirstByText = (text) => screen.getAllByText(text)[0];
    const getFirstByPlaceholder = (text) => screen.getAllByPlaceholderText(text)[0];
    const getFirstByDisplayValue = (val) => screen.getAllByDisplayValue(val)[0];

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            showSubscribeModal: true,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
            openAuthModal: mockOpenAuthModal,
            user: null,
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders correctly when open', () => {
        render(<SubscribeModal />);

        expect(getFirstByText(/GET THE WEEKLY DROP/i)).toBeInTheDocument();
        expect(getFirstByPlaceholder(/your@email.com/i)).toBeInTheDocument();
        expect(getFirstByText(/SUBSCRIBE FREE/i)).toBeInTheDocument();
    });

    it('pre-fills email if user is logged in', () => {
        useAuth.mockReturnValue({
            showSubscribeModal: true,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
            openAuthModal: mockOpenAuthModal,
            user: { email: 'test@example.com' },
        });

        render(<SubscribeModal />);
        expect(getFirstByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        useAuth.mockReturnValue({
            showSubscribeModal: false,
            closeSubscribeModal: mockCloseSubscribeModal,
            subscribeNewsletter: mockSubscribeNewsletter,
            openAuthModal: mockOpenAuthModal,
            user: null,
        });

        const { container } = render(<SubscribeModal />);
        expect(container).toBeEmptyDOMElement();
    });

    it('disables submit button for invalid email', () => {
        render(<SubscribeModal />);

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'not-an-email' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');
        expect(submitButton).toBeDisabled();
    });

    it('enables submit button for valid email', () => {
        render(<SubscribeModal />);

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'valid@email.com' } });

        const submitButton = getFirstByText(/SUBSCRIBE FREE/i).closest('button');
        expect(submitButton).not.toBeDisabled();
    });

    it('shows success state after successful subscription', async () => {
        mockSubscribeNewsletter.mockResolvedValue({});
        render(<SubscribeModal />);

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(input.closest('form'));

        await waitFor(() => {
            expect(getFirstByText(/YOU'RE ON THE LIST/i)).toBeInTheDocument();
        });
        expect(mockSubscribeNewsletter).toHaveBeenCalledWith('test@example.com');
    });

    it('shows error message on failed subscription', async () => {
        mockSubscribeNewsletter.mockRejectedValue(new Error('Subscription failed'));
        render(<SubscribeModal />);

        const input = getFirstByPlaceholder(/your@email.com/i);
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(input.closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Subscription failed')).toBeInTheDocument();
        });
    });

    it('opens auth modal when "Create an account" is clicked', () => {
        render(<SubscribeModal />);

        fireEvent.click(getFirstByText(/Create an account/i));

        expect(mockCloseSubscribeModal).toHaveBeenCalled();
        expect(mockOpenAuthModal).toHaveBeenCalledWith('signin');
    });
});

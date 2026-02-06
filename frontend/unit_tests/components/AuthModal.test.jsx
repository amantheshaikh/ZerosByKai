import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthModal from '../../components/AuthModal';
import { useAuth, apiFetch } from '@/lib/auth';

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
    getApiUrl: vi.fn(() => 'http://localhost:3001'),
    apiFetch: vi.fn(),
}));

// Mock fetch for any other usage
global.fetch = vi.fn();

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('AuthModal', () => {
    const mockCloseAuthModal = vi.fn();
    const mockSignInWithProvider = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            showAuthModal: true,
            closeAuthModal: mockCloseAuthModal,
            signInWithProvider: mockSignInWithProvider,
        });
    });

    it('renders OAuth buttons', async () => {
        render(<AuthModal />);
        await waitFor(() => {
            expect(screen.getByText(/CONTINUE WITH GOOGLE/i)).toBeInTheDocument();
            expect(screen.getByText(/CONTINUE WITH GITHUB/i)).toBeInTheDocument();
        });
    });

    it('calls signInWithProvider when Google button is clicked', async () => {
        render(<AuthModal />);

        const googleBtn = await screen.findByText(/CONTINUE WITH GOOGLE/i);
        fireEvent.click(googleBtn);

        expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
    });

    it('handles magic link submission', async () => {
        apiFetch.mockResolvedValue({ exists: false, hasName: false });

        render(<AuthModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

        // Wait for debounced user check
        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/auth/check', expect.any(Object));
        });

        // For new users, name field appears
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Your Name \(Required\)/i)).toBeInTheDocument();
        });
        const nameInput = screen.getByPlaceholderText(/Your Name \(Required\)/i);
        fireEvent.change(nameInput, { target: { value: 'Test User' } });

        // Mock signup response
        apiFetch.mockResolvedValueOnce({ message: 'Magic link sent' });

        const submitButton = screen.getByRole('button', { name: /^CONTINUE$/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/CHECK YOUR EMAIL/i)).toBeInTheDocument();
            expect(screen.getByText(/new@example.com/i)).toBeInTheDocument();
        });
    });

    it('shows name field for new users', async () => {
        // Mock user check to indicate user exists but has no name
        apiFetch.mockResolvedValue({ exists: true, hasName: false });

        render(<AuthModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Your Name \(Required\)/i)).toBeInTheDocument();
        });
    });

    it('keeps submit button disabled for invalid email', async () => {
        render(<AuthModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /^(SIGN IN|CONTINUE)$/i });

        // Wait for mount reset
        await waitFor(() => expect(emailInput.value).toBe(''));

        // Invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        expect(submitButton).toBeDisabled();

        // Partially valid
        fireEvent.change(emailInput, { target: { value: 'aman@g' } });
        expect(submitButton).toBeDisabled();
    });

    it('resets name when email changes', async () => {
        // 1. Mock first user check (existing user with name)
        apiFetch.mockResolvedValueOnce({ exists: true, hasName: true, name: 'Aman' });

        render(<AuthModal />);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);

        // Type first email
        fireEvent.change(emailInput, { target: { value: 'aman@existing.com' } });

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/auth/check', expect.any(Object));
        });

        // Verify name is not visible yet (since it's welcome mode) or just check state
        // In our component, for isRecognized, we show "WELCOME BACK, AMAN!"
        expect(screen.getByText(/WELCOME BACK, AMAN!/i)).toBeInTheDocument();

        // 2. Mock second user check (new user)
        apiFetch.mockResolvedValueOnce({ exists: false, hasName: false });

        // Change email to something else
        fireEvent.change(emailInput, { target: { value: 'test@new.com' } });

        // Wait for check
        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledTimes(2);
        });

        // Verify "WELCOME BACK, AMAN!" is gone and it's joining mode
        expect(screen.queryByText(/WELCOME BACK, AMAN!/i)).not.toBeInTheDocument();
        expect(screen.getByText(/JOIN THE REVOLUTION/i)).toBeInTheDocument();

        // Verify name field is empty
        const nameInput = screen.getByPlaceholderText(/Your Name \(Required\)/i);
        expect(nameInput.value).toBe('');
    });
});

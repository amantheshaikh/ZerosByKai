import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthModal from '../../components/AuthModal';
import { useAuth, apiFetch } from '@/lib/auth';
import { renderWithProviders } from '../utils/renderWithProviders';

// Mock fetch for any other usage
global.fetch = vi.fn();

describe('AuthModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders OAuth buttons', async () => {
        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });
        await waitFor(() => {
            expect(screen.getByText(/CONTINUE WITH GOOGLE/i)).toBeInTheDocument();
            expect(screen.getByText(/CONTINUE WITH GITHUB/i)).toBeInTheDocument();
        });
    });

    it('calls signInWithProvider when Google button is clicked', async () => {
        const signInWithProvider = vi.fn();
        renderWithProviders(<AuthModal />, {
            initialAuthState: { showAuthModal: true, signInWithProvider }
        });

        const googleBtn = await screen.findByText(/CONTINUE WITH GOOGLE/i);
        fireEvent.click(googleBtn);

        expect(signInWithProvider).toHaveBeenCalledWith('google');
    });

    it('handles magic link submission', async () => {
        apiFetch.mockResolvedValue({ exists: false, hasName: false });

        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

        // Wait for debounced user check
        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/auth/check', expect.any(Object));
        }, { timeout: 2000 });

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

        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Your Name \(Required\)/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('shows branded error for invalid email on submit', async () => {
        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const submitButton = screen.getByRole('button', { name: /^(SIGN IN|CONTINUE)$/i });

        // Wait for mount reset
        await waitFor(() => expect(emailInput.value).toBe(''));

        // Invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        // Button should NOT be disabled now
        expect(submitButton).not.toBeDisabled();

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Kai needs a real email to transmit data/i)).toBeInTheDocument();
        });
    });

    it('shows branded error for missing name on submit', async () => {
        // Mock user check to indicate user exists but has no name
        apiFetch.mockResolvedValue({ exists: true, hasName: false });

        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Your Name \(Required\)/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        const submitButton = screen.getByRole('button', { name: /^(SIGN IN|CONTINUE)$/i });

        // Submit without filling name
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Kai needs to know what to call you. Name required/i)).toBeInTheDocument();
        });
    });

    it('resets name when email changes', async () => {
        // 1. Mock first user check (existing user with name)
        apiFetch.mockResolvedValueOnce({ exists: true, hasName: true, name: 'Aman' });

        renderWithProviders(<AuthModal />, { initialAuthState: { showAuthModal: true } });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);

        // Type first email
        fireEvent.change(emailInput, { target: { value: 'aman@existing.com' } });

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/auth/check', expect.any(Object));
        }, { timeout: 2000 });

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
        }, { timeout: 2000 });

        // Verify "WELCOME BACK, AMAN!" is gone and it's joining mode
        expect(screen.queryByText(/WELCOME BACK, AMAN!/i)).not.toBeInTheDocument();
        expect(screen.getByText(/JOIN THE REVOLUTION/i)).toBeInTheDocument();

        // Verify name field is empty
        const nameInput = screen.getByPlaceholderText(/Your Name \(Required\)/i);
        expect(nameInput.value).toBe('');
    });

    it('calls closeAuthModal when close button is clicked', () => {
        const closeAuthModal = vi.fn();
        renderWithProviders(<AuthModal />, {
            initialAuthState: { showAuthModal: true, closeAuthModal }
        });
        const closeBtn = screen.getByRole('button', { name: /Close modal/i });
        fireEvent.click(closeBtn);
        expect(closeAuthModal).toHaveBeenCalled();
    });
});

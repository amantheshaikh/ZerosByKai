import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/router';
import Unsubscribe from '../../pages/unsubscribe';
import { getApiUrl } from '@/lib/auth';

// Mock next/router with custom implementation per test
vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));

// Mock auth lib
vi.mock('@/lib/auth', () => ({
    getApiUrl: vi.fn(() => 'http://localhost:3001'),
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
    const filterMotionProps = (props) => {
        const {
            whileInView, viewport, whileHover, whileTap, drag, dragConstraints,
            dragElastic, onDragEnd, initial, animate, exit, variants,
            transition, custom, layout, ...rest
        } = props;
        return rest;
    };
    return {
        motion: {
            div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
        },
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

describe('Unsubscribe Page', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        // Default router mock
        useRouter.mockReturnValue({
            isReady: true,
            query: { email: 'test@example.com', token: 'valid-token' },
            push: mockPush,
        });
    });

    describe('Initial Loading State', () => {
        it('shows loading state while verifying token', async () => {
            // Keep fetch pending
            global.fetch.mockImplementation(() => new Promise(() => { }));

            render(<Unsubscribe />);

            expect(screen.getByText(/CHECKING POSTAL SERVICE/i)).toBeInTheDocument();
        });

        it('shows error state if email or token is missing', async () => {
            useRouter.mockReturnValue({
                isReady: true,
                query: {}, // No email or token
                push: mockPush,
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/OOPS!/i)).toBeInTheDocument();
            });
        });
    });

    describe('Token Verification', () => {
        it('shows confirm state when token is valid', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: false }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/WAIT! ARE YOU SURE\?/i)).toBeInTheDocument();
            });
        });

        it('shows already unsubscribed state when user is already unsubscribed', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: true }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/ALREADY DONE/i)).toBeInTheDocument();
            });
        });

        it('shows error state when verification fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Invalid token' }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/OOPS!/i)).toBeInTheDocument();
            });
        });

        it('shows error state on network error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/OOPS!/i)).toBeInTheDocument();
            });
        });
    });

    describe('Confirmation Flow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: false }),
            });
        });

        it('navigates home when user clicks "NO, I WANT TO STAY!"', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/NO, I WANT TO STAY!/i)).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText(/NO, I WANT TO STAY!/i));

            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('shows survey when user clicks to unsubscribe', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                expect(screen.getByText(/Yes, unsubscribe me/i)).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));

            await waitFor(() => {
                expect(screen.getByText(/ONE LAST THING.../i)).toBeInTheDocument();
            });
        });
    });

    describe('Survey Flow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: false }),
            });
        });

        it('displays all unsubscribe reasons', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                expect(screen.getByText(/I'm not building a startup right now/i)).toBeInTheDocument();
                expect(screen.getByText(/Too many emails in my inbox/i)).toBeInTheDocument();
                expect(screen.getByText(/The ideas aren't relevant to me/i)).toBeInTheDocument();
            });
        });

        it('disables confirm button until reason is selected', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const confirmButton = screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i });
                expect(confirmButton).toBeDisabled();
            });
        });

        it('enables confirm button when reason is selected', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            const confirmButton = screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i });
            expect(confirmButton).not.toBeDisabled();
        });

        it('allows going back from survey to confirm screen', async () => {
            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                expect(screen.getByText(/ONE LAST THING.../i)).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText(/Back/i));

            await waitFor(() => {
                expect(screen.getByText(/WAIT! ARE YOU SURE\?/i)).toBeInTheDocument();
            });
        });
    });

    describe('Unsubscribe Submission', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: false }),
            });
        });

        it('submits unsubscribe request with selected reason', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Unsubscribed successfully' }),
            });

            render(<Unsubscribe />);

            // Navigate to survey
            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            // Select reason
            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            // Submit
            fireEvent.click(screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i }));

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:3001/api/auth/unsubscribe',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({
                            email: 'test@example.com',
                            token: 'valid-token',
                            reason: 'Too many emails in my inbox',
                        }),
                    })
                );
            });
        });

        it('shows success state after successful unsubscribe', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Unsubscribed successfully' }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            fireEvent.click(screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i }));

            await waitFor(() => {
                expect(screen.getByText(/UNSUBSCRIBED/i)).toBeInTheDocument();
                expect(screen.getByText(/You've been removed from the list/i)).toBeInTheDocument();
            });
        });

        it('shows error state on submission failure', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Failed to unsubscribe' }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            fireEvent.click(screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i }));

            await waitFor(() => {
                expect(screen.getByText(/OOPS!/i)).toBeInTheDocument();
            });
        });

        it('shows processing text while submitting', async () => {
            // Keep submission pending
            global.fetch.mockImplementationOnce(() => new Promise(() => { }));

            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            fireEvent.click(screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i }));

            expect(screen.getByText(/PROCESSING.../i)).toBeInTheDocument();
        });
    });

    describe('Router Not Ready', () => {
        it('waits for router to be ready before verifying', () => {
            useRouter.mockReturnValue({
                isReady: false,
                query: {},
                push: mockPush,
            });

            render(<Unsubscribe />);

            // Should still show loading since router isn't ready
            expect(screen.getByText(/CHECKING POSTAL SERVICE/i)).toBeInTheDocument();

            // Fetch should not have been called yet
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('Navigation Links', () => {
        it('has return home link on success page', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: false }),
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: 'Unsubscribed successfully' }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                fireEvent.click(screen.getByText(/Yes, unsubscribe me/i));
            });

            await waitFor(() => {
                const radioButton = screen.getByLabelText(/Too many emails in my inbox/i);
                fireEvent.click(radioButton);
            });

            fireEvent.click(screen.getByRole('button', { name: /CONFIRM UNSUBSCRIBE/i }));

            await waitFor(() => {
                const returnLink = screen.getByRole('link', { name: /RETURN HOME/i });
                expect(returnLink).toHaveAttribute('href', '/');
            });
        });

        it('has return home link on already unsubscribed page', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ valid: true, isUnsubscribed: true }),
            });

            render(<Unsubscribe />);

            await waitFor(() => {
                const returnLink = screen.getByRole('link', { name: /RETURN HOME/i });
                expect(returnLink).toHaveAttribute('href', '/');
            });
        });
    });
});

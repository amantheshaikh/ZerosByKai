import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth, getApiUrl, getRedirectUrl } from '../../lib/auth';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createPagesBrowserClient: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const TestComponent = () => {
    const { user, isLoading, signInWithProvider, sendMagicLink } = useAuth();
    if (isLoading) return <div data-testid="loading">Loading...</div>;
    return (
        <div>
            <div data-testid="user-id">{user?.id}</div>
            <button onClick={() => signInWithProvider('google')}>Sign in with Google</button>
            <button onClick={() => sendMagicLink('test@example.com')}>Send Magic Link</button>
        </div>
    );
};

describe('Auth Library', () => {
    let mockSupabase;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
                onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
                signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
                signOut: vi.fn().mockResolvedValue({ error: null }),
                refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            },
        };
        createPagesBrowserClient.mockReturnValue(mockSupabase);

        // Mock window location
        delete window.location;
        window.location = {
            hostname: 'localhost',
            origin: 'http://localhost:3000',
            search: '',
            hash: '',
            href: 'http://localhost:3000',
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('getApiUrl', () => {
        it('returns localhost URL when on localhost', () => {
            expect(getApiUrl()).toBe('http://localhost:3001');
        });
    });

    describe('getRedirectUrl', () => {
        it('returns window.location.origin', () => {
            expect(getRedirectUrl()).toBe('http://localhost:3000');
        });
    });

    describe('AuthProvider', () => {
        it('initializes with no user by default', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            });

            expect(screen.getByTestId('user-id').textContent).toBe('');
        });

        it('initializes with user if session exists', async () => {
            const mockUser = { id: 'user_123' };
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { user: mockUser } },
                error: null,
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
                expect(screen.getByTestId('user-id').textContent).toBe('user_123');
            });
        });

        it('calls signInWithOAuth when signInWithProvider is called', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            });

            const button = screen.getByText('Sign in with Google');
            button.click();

            expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: expect.objectContaining({
                    redirectTo: expect.stringContaining('/auth/callback'),
                }),
            });
        });

        it('calls API for magic link signup', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ message: 'Success' }),
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            });

            const button = screen.getByText('Send Magic Link');
            button.click();

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/auth/signup'),
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining('test@example.com'),
                    })
                );
            });
        });
    });
});

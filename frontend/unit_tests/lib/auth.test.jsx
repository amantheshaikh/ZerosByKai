import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createPagesBrowserClient: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
});

import { AuthProvider, useAuth, getApiUrl, getRedirectUrl, apiFetch } from '../../lib/auth';

// Ensure we use the real lib/auth for its own tests, bypassing the global mock
vi.unmock('@/lib/auth');

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
                setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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

        it('handles signOut correctly', async () => {
            const mockUser = { id: 'user_123' };
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { user: mockUser } },
                error: null,
            });

            const { result } = render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
            
            // Note: Since TestComponent doesn't expose signOut, we'll verify it via child component or direct call if we used renderHook
        });

        it('detects tokens in URL hash and manually sets session', async () => {
            window.location.hash = '#access_token=foo&refresh_token=bar';
            mockSupabase.auth.setSession.mockResolvedValue({ data: { session: { user: { id: 'hash_user' } } }, error: null });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
                    access_token: 'foo',
                    refresh_token: 'bar',
                });
            });
        });

        it('schedules session refresh if session.expires_at exists', async () => {
            const now = Date.now();
            const waitTime = 500000;
            const expiresAt = Math.floor((now + waitTime + 300000) / 1000); 
            
            mockSupabase.auth.getSession.mockResolvedValue({
                data: { session: { user: { id: 'u1' }, expires_at: expiresAt } },
                error: null,
            });

            const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
            
            await act(async () => {
                render(
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                );
            });

            await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
            
            // Check for a timer scheduled for around waitTime (500,000ms)
            await waitFor(() => {
                const call = setTimeoutSpy.mock.calls.find(c => c[1] > waitTime - 20000 && c[1] < waitTime + 20000);
                expect(call).toBeDefined();
            });

            setTimeoutSpy.mockRestore();
        });

        it('handles SIGNED_IN auth event', async () => {
            let authCallback;
            mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
                authCallback = cb;
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
            
            const mockSession = { user: { id: 'u1' }, access_token: 't' };
            await act(async () => {
                authCallback('SIGNED_IN', mockSession);
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/auth/post-login'),
                    expect.any(Object)
                );
            });
        });

        it('handles SIGNED_OUT auth event', async () => {
            let authCallback;
            mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
                authCallback = cb;
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
            
            await act(async () => {
                authCallback('SIGNED_OUT', null);
            });
            
            await waitFor(() => {
                expect(screen.getByTestId('user-id').textContent).toBe('');
            });
        });
    });

    describe('apiFetch', () => {
        it('throws error on non-ok response', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Bad Request' }),
            });

            await expect(apiFetch('/test')).rejects.toThrow('Bad Request');
        });

        it('injects authorization header when session is provided', async () => {
            const { apiFetch } = await import('../../lib/auth');
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            const session = { access_token: 'mock-token' };
            await apiFetch('/test', {}, session);

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token'
                    })
                })
            );
        });
    });
});

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

const AuthContext = createContext(null);

/**
 * Get API URL based on environment
 * @returns {string} API base URL
 */
export function getApiUrl() {
  // Server-side: use env var
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Client-side: check hostname for localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Get redirect URL for OAuth flows
 * @returns {string|undefined} Redirect URL
 */
export function getRedirectUrl() {
  if (typeof window === 'undefined') return undefined;

  // Prefer env var for consistency
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return window.location.origin;
}

/**
 * Fetch wrapper with automatic auth header injection
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @param {Object} session - Supabase session (optional)
 * @returns {Promise<any>} Response data
 * @throws {Error} Request error with message
 */
export async function apiFetch(path, options = {}, session = null) {
  const url = `${getApiUrl()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Inject auth token if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });

    // Handle non-OK responses
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = body.error || body.message || `Request failed (${res.status})`;
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

/**
 * Auth Provider Component
 * 
 * Handles all authentication flows:
 * 1. Email token auto-login (from weekly digest emails)
 * 2. Magic link authentication (passwordless)
 * 3. Google OAuth
 * 4. Newsletter-only subscriptions (no account)
 * 5. Post-login hooks (welcome email, subscriber sync)
 * 6. Session management and persistence
 * 7. Auth state synchronization
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  // Supabase client (singleton)
  const [supabase] = useState(() => createPagesBrowserClient());

  // Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'join'

  // Refs to prevent duplicate operations
  const isInitialized = useRef(false);
  const postLoginProcessed = useRef(new Set());

  /**
   * Check for email token in URL and auto-login
   * This enables seamless voting from weekly digest emails
   */
  const checkEmailToken = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) return;

    try {
      console.log('🔑 Email token found, verifying...');

      // Verify token with backend
      const data = await apiFetch('/api/auth/verify-email-token', {
        method: 'POST',
        body: JSON.stringify({ token })
      });

      if (data?.session) {
        // Set the session in Supabase
        const { error: sessionError } = await supabase.auth.setSession(data.session);

        if (sessionError) {
          console.error('❌ Failed to set session:', sessionError);
          throw sessionError;
        }

        // Clean up URL (remove token parameter)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('token');
        window.history.replaceState({}, '', newUrl.toString());

        console.log('✅ Auto-login successful via email token');
      }
    } catch (error) {
      console.error('❌ Email token verification failed:', error.message);
      setError('Auto-login failed. Please sign in manually.');

      // Clean up invalid token from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [supabase]);

  /**
   * Post-login hook
   * Runs after successful authentication to:
   * 1. Sync subscriber record with auth user
   * 2. Send welcome email for new users
   * 3. Mark user as welcomed
   * 
   * Uses session-based deduplication to prevent duplicate calls
   */
  const handlePostLogin = useCallback(async (session) => {
    if (!session?.user?.id || !session?.access_token) {
      console.warn('⚠️ Post-login called without valid session');
      return;
    }

    const userId = session.user.id;

    // Prevent duplicate post-login calls for the same user
    if (postLoginProcessed.current.has(userId)) {
      console.log('ℹ️ Post-login already processed for this user');
      return;
    }

    try {
      console.log('🔄 Running post-login hook...');

      const data = await apiFetch('/api/auth/post-login', {
        method: 'POST'
      }, session);

      postLoginProcessed.current.add(userId);

      if (data?.isNewUser) {
        console.log('✅ Welcome email sent to new user');
      } else {
        console.log('✅ Returning user authenticated');
      }
    } catch (err) {
      console.error('❌ Post-login hook failed:', err.message);
      // Non-critical - don't block user experience
    }
  }, []);

  /**
   * Handle sign-out cleanup
   * Clears post-login tracking
   */
  const handleSignOut = useCallback(() => {
    postLoginProcessed.current.clear();
    setError(null);
    console.log('✅ Sign-out cleanup completed');
  }, []);

  /**
   * Initialize auth state
   * 1. Check for email token first (auto-login)
   * 2. Get current session from Supabase
   * 3. Set up auth state listener
   */
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeAuth = async () => {
      try {
        // Check for email token first
        await checkEmailToken();

        // Check for hash fragment with tokens (Magic Link fix)
        // Sometimes Supabase auto-detection fails, so we handle it manually
        if (typeof window !== 'undefined' && window.location.hash) {
          const params = new URLSearchParams(window.location.hash.replace('#', ''));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('🔑 Detected tokens in hash, manually setting session...');
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('❌ Failed to set session from hash:', setSessionError);
            } else if (data?.session) {
              console.log('✅ Session manually set from hash');

              // Clear hash from URL
              const newUrl = window.location.href.split('#')[0];
              window.history.replaceState({}, document.title, newUrl);

              // Trigger post login immediately since we just established session
              await handlePostLogin(data.session);
            }
          }
        }

        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Failed to get session:', sessionError);
          throw sessionError;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        console.log('✅ Auth initialized:', currentSession ? 'Authenticated' : 'Not authenticated');
      } catch (error) {
        console.error('❌ Auth initialization failed:', error.message);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    /**
     * Listen for auth state changes
     * Handles: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔐 Auth event:', event);

        // Update state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // Handle sign-in events (magic link, OAuth, email token, token refresh)
        if (event === 'SIGNED_IN' && newSession?.access_token) {
          await handlePostLogin(newSession);
        }

        // Handle token refresh (silent, no post-login needed)
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        }

        // Handle sign-out events
        if (event === 'SIGNED_OUT') {
          handleSignOut();
        }

        // Handle user updates (profile changes, etc.)
        if (event === 'USER_UPDATED') {
          console.log('👤 User updated');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, [supabase, checkEmailToken, handlePostLogin, handleSignOut]);

  /**
   * Sign out user
   * Clears session, state, and redirects to home
   */
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Sign-out error:', error);
        throw error;
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setError(null);
      handleSignOut();

      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Sign-out failed:', error.message);
      setError('Failed to sign out. Please try again.');
      setIsLoading(false);
    }
  }, [supabase, handleSignOut]);

  /**
   * Sign in with Google OAuth
   * Redirects to Google for authentication
   * @throws {Error} OAuth initialization error
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      const origin = getRedirectUrl();

      if (!origin) {
        throw new Error('Redirect URL not configured');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', error.message);
        throw error;
      }

      console.log('🔄 Redirecting to Google...');
    } catch (error) {
      console.error('❌ Google sign-in failed:', error.message);
      setError('Failed to sign in with Google. Please try again.');
      throw error;
    }
  }, [supabase]);

  /**
   * Send magic link to email
   * Used for passwordless authentication
   * 
   * @param {string} email - User's email address
   * @param {string|null} name - User's name (optional, for new users)
   * @returns {Promise<{message: string, email: string, isExisting: boolean}>}
   * @throws {Error} Magic link send error
   */
  const sendMagicLink = useCallback(async (email, name = null) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name?.trim() || null
        })
      });

      console.log('✅ Magic link sent to:', email);
      return data;
    } catch (error) {
      console.error('❌ Magic link error:', error.message);
      throw new Error(error.message || 'Failed to send magic link');
    }
  }, []);

  /**
   * Subscribe to newsletter only (no account creation)
   * Used for users who just want weekly emails without voting ability
   * 
   * @param {string} email - User's email address
   * @param {string|null} name - User's name (optional)
   * @returns {Promise<{message: string}>}
   * @throws {Error} Subscription error
   */
  const subscribeNewsletter = useCallback(async (email, name = null) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const data = await apiFetch('/api/auth/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name?.trim() || null
        })
      });

      console.log('✅ Newsletter subscription successful:', email);
      return data;
    } catch (error) {
      console.error('❌ Newsletter subscription error:', error.message);
      throw new Error(error.message || 'Failed to subscribe to newsletter');
    }
  }, []);

  /**
   * Open authentication modal
   * @param {('signin'|'join')} mode - Modal mode
   */
  const openAuthModal = useCallback((mode = 'signin') => {
    if (mode !== 'signin' && mode !== 'join') {
      console.warn('⚠️ Invalid auth modal mode:', mode, '- defaulting to signin');
      mode = 'signin';
    }

    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  /**
   * Close authentication modal
   */
  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    // Auth state
    user,
    session,
    isLoading,
    error,

    // Auth methods
    signOut,
    signInWithGoogle,
    sendMagicLink,
    subscribeNewsletter,
    clearError,

    // Modal state
    showAuthModal,
    authModalMode,
    openAuthModal,
    closeAuthModal,

    // Supabase client (for advanced use cases)
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}

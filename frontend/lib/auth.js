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
  const postLoginProcessed = useRef(new Map()); // Changed from Set to Map for thread-safe dedup
  const refreshTimerRef = useRef(null);

  /**
   * Schedule session refresh before JWT expiry
   * Refreshes 5 minutes before expiration to prevent sudden logouts
   */
  const scheduleSessionRefresh = useCallback((session) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!session?.expires_at) {
      return;
    }

    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshBefore = 5 * 60 * 1000; // Refresh 5 minutes before expiry

    // If already expired or expires soon, refresh immediately
    if (timeUntilExpiry <= refreshBefore) {
      console.log('🔄 Session expiring soon, refreshing immediately...');
      supabase.auth.refreshSession().catch(err => {
        console.error('❌ Failed to refresh session:', err.message);
      });
      return;
    }

    // Schedule refresh for (expiry - 5 minutes)
    const refreshAt = timeUntilExpiry - refreshBefore;
    console.log(`⏰ Session refresh scheduled in ${Math.floor(refreshAt / 1000)}s`);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Auto-refreshing session...');
        const { error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('❌ Failed to auto-refresh session:', error.message);
          // User will be logged out on next action requiring auth
          return;
        }

        console.log('✅ Session auto-refreshed successfully');
      } catch (error) {
        console.error('❌ Session refresh error:', error.message);
      }
    }, refreshAt);
  }, [supabase]);

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
   * Uses Promise-based deduplication to prevent concurrent duplicate calls
   * Thread-safe: concurrent logins for same user will wait for first to complete
   */
  const handlePostLogin = useCallback(async (session) => {
    if (!session?.user?.id || !session?.access_token) {
      console.warn('⚠️ Post-login called without valid session');
      return;
    }

    const userId = session.user.id;

    // Check if we're already processing this user
    if (postLoginProcessed.current.has(userId)) {
      // Wait for the existing promise to complete
      try {
        await postLoginProcessed.current.get(userId);
        console.log('ℹ️ Post-login already completed for this user');
      } catch (err) {
        console.warn('⚠️ Previous post-login failed, retrying...');
      }
      return;
    }

    // Create and store the promise before starting async work
    const promise = (async () => {
      try {
        console.log('🔄 Running post-login hook...');

        const data = await apiFetch('/api/auth/post-login', {
          method: 'POST'
        }, session);

        if (data?.isNewUser) {
          console.log('✅ Welcome email sent to new user');
        } else {
          console.log('✅ Returning user authenticated');
        }
      } catch (err) {
        console.error('❌ Post-login hook failed:', err.message);
        // Non-critical - don't block user experience
        throw err;
      }
    })();

    postLoginProcessed.current.set(userId, promise);

    try {
      await promise;
    } catch {
      // Error already logged above
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

        // Schedule session refresh before expiry
        if (newSession?.expires_at) {
          scheduleSessionRefresh(newSession);
        }

        // Handle sign-in events (magic link, OAuth, email token, token refresh)
        if (event === 'SIGNED_IN' && newSession?.access_token) {
          await handlePostLogin(newSession);
        }

        // Handle token refresh (silent, no post-login needed)
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          // Reschedule refresh for the new token expiry
          if (newSession?.expires_at) {
            scheduleSessionRefresh(newSession);
          }
        }

        // Handle sign-out events
        if (event === 'SIGNED_OUT') {
          handleSignOut();
          // Clear refresh timer on sign-out
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
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
      // Clean up refresh timer on unmount
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [supabase, checkEmailToken, handlePostLogin, handleSignOut, scheduleSessionRefresh]);

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
   * Sign in with OAuth Provider
   * Redirects to provider for authentication
   * @param {string} provider - 'google' | 'facebook' | 'github' | 'linkedin'
   * @throws {Error} OAuth initialization error
   */
  const signInWithProvider = useCallback(async (provider) => {
    try {
      const origin = getRedirectUrl();

      if (!origin) {
        throw new Error('Redirect URL not configured');
      }

      // Provider-specific options
      const options = {
        redirectTo: `${origin}/auth/callback`,
      };

      if (provider === 'google') {
        options.queryParams = {
          access_type: 'offline',
          prompt: 'consent',
        };
      }

      // Specific scopes can be added here if needed in the future
      // if (provider === 'github') options.scopes = 'read:user user:email';

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error.message);
        throw error;
      }

      console.log(`🔄 Redirecting to ${provider}...`);
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error.message);
      setError(`Failed to sign in with ${provider}. Please try again.`);
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
    signInWithProvider, // Generic OAuth method
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

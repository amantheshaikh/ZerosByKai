import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

const AuthContext = createContext(null);

export function getApiUrl() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export function getRedirectUrl() {
  if (typeof window === 'undefined') return undefined; // Should satisfy SSR if needed, though usually client-side
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  return window.location.origin;
}

export async function apiFetch(path, options = {}, session) {
  const url = `${getApiUrl()}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createPagesBrowserClient());
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'join'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setIsLoading(false);

        // Fire post-login hook on sign-in (covers magic link + Google OAuth)
        if (_event === 'SIGNED_IN' && s?.access_token) {
          if (!sessionStorage.getItem('zbk_post_login_done')) {
            apiFetch('/api/auth/post-login', { method: 'POST' }, s)
              .then(() => sessionStorage.setItem('zbk_post_login_done', '1'))
              .catch((err) => console.error('Post-login hook failed:', err));
          }
        }

        // Clear flag on sign-out
        if (_event === 'SIGNED_OUT') {
          sessionStorage.removeItem('zbk_post_login_done');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    window.location.href = '/';
  };



  const signInWithGoogle = useCallback(async () => {
    const origin = getRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  }, [supabase]);

  const openAuthModal = useCallback((mode = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, signOut, supabase, signInWithGoogle,
      showAuthModal, authModalMode, openAuthModal, closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

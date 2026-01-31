import { useState, useEffect } from 'react';
import { useAuth, getApiUrl } from '@/lib/auth';

export default function AuthModal() {
  const { showAuthModal, authModalMode, closeAuthModal, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState(authModalMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Sync mode when modal opens
  useEffect(() => {
    if (showAuthModal) {
      setMode(authModalMode);
      setStatus('idle');
      setErrorMsg('');
      setEmail('');
      setName('');
    }
  }, [showAuthModal, authModalMode]);

  // Auto-close after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => closeAuthModal(), 8000);
      return () => clearTimeout(timer);
    }
  }, [status, closeAuthModal]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const apiUrl = getApiUrl();
      const body = mode === 'signin' ? { email } : { email, name };

      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const isSignIn = mode === 'signin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeAuthModal}>
      <div
        className="pop-in comic-panel bg-white p-8 max-w-md w-full mx-4 comic-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex border-b-4 border-black mb-6">
          <button
            onClick={() => { setMode('signin'); setStatus('idle'); setErrorMsg(''); }}
            className={`flex-1 py-3 comic-title text-lg tracking-wider transition-colors ${
              isSignIn ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode('join'); setStatus('idle'); setErrorMsg(''); }}
            className={`flex-1 py-3 comic-title text-lg tracking-wider transition-colors ${
              !isSignIn ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            JOIN
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">&#9993;</div>
            <h2 className="comic-title text-2xl mb-3 text-black">CHECK YOUR EMAIL!</h2>
            <p className="comic-body text-gray-700">
              We sent a magic link to <span className="font-bold">{email}</span>.
            </p>
            <p className="comic-body text-gray-500 text-sm mt-2">Click the link to sign in. No password needed.</p>
            <button
              onClick={closeAuthModal}
              className="mt-6 px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
            >
              GOT IT
            </button>
          </div>
        ) : (
          <>
            <h2 className="comic-title text-2xl mb-1 text-black">
              {isSignIn ? 'WELCOME BACK' : 'CREATE YOUR ACCOUNT'}
            </h2>
            <p className="comic-body text-gray-500 text-sm mb-6">
              {isSignIn
                ? "We'll email you a magic link. No password needed."
                : 'Free account. Vote on ideas. Earn badges.'}
            </p>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full px-6 py-4 bg-white border-3 border-black comic-title text-base hover:bg-gray-50 transition-all comic-shadow flex items-center justify-center gap-3 mb-4 text-black"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isSignIn ? 'SIGN IN WITH GOOGLE' : 'JOIN WITH GOOGLE'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t-2 border-gray-300"></div>
              <span className="comic-body text-xs text-gray-400 font-bold uppercase">or use email</span>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                  required
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-3 border-black comic-body focus:outline-none focus:ring-4 focus:ring-yellow-400 text-black"
                required
              />

              {status === 'error' && (
                <div className="bg-red-50 border-2 border-red-400 p-3 text-red-700 comic-body text-sm">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-rose-700 text-white comic-title text-lg hover:bg-rose-800 transition-all comic-shadow disabled:opacity-50"
              >
                {status === 'loading'
                  ? 'SENDING...'
                  : isSignIn
                    ? 'SEND MAGIC LINK'
                    : 'JOIN & START VOTING'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

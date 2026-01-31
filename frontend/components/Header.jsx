import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth';
import BadgeDisplay from './BadgeDisplay';
import HamburgerMenu from './HamburgerMenu';

export default function Header({ variant = 'landing' }) {
  const { user, isLoading, signOut, openAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPage = variant === 'page';
  const isStory = variant === 'story';

  return (
    <header
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[101] flex items-center justify-between w-[92%] max-w-7xl px-4 py-2 sm:px-6 sm:py-3 bg-white border-3 sm:border-4 border-black rounded-xl sm:rounded-2xl comic-shadow"
    >
      {isStory ? (
        <Link href="/" className="flex items-center gap-2 font-bold hover:underline comic-body text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      ) : (
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/favicon.ico"
            alt="ZerosByKai Logo"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
          <div className="comic-title text-2xl sm:text-3xl text-gray-900 tracking-widest">
            ZEROS BY KAI
          </div>
        </Link>
      )}

      {/* Desktop Navigation */}
      <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-2 sm:gap-3">
        <Link
          href="/story"
          className="px-3 sm:px-4 py-2 comic-title text-xs sm:text-sm text-black hover:text-rose-700 transition-colors"
        >
          KAI&apos;S STORY
        </Link>
        <Link
          href="/#ideas-section"
          className="px-3 sm:px-4 py-2 comic-title text-xs sm:text-sm text-black hover:text-rose-700 transition-colors"
        >
          THIS WEEK
        </Link>
        {isLoading ? null : user ? (
          <>
            <BadgeDisplay />
            <Link
              href="/profile"
              className="px-4 py-2 comic-title text-sm text-black hover:text-rose-700 transition-colors"
            >
              PROFILE
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
            >
              SIGN OUT
            </button>
          </>
        ) : (
          <button
            onClick={() => openAuthModal('signin')}
            className="px-6 py-2 bg-black text-yellow-400 comic-title text-sm hover:bg-gray-900 transition-colors comic-shadow"
          >
            Sign In
          </button>
        )}
      </nav>

      {/* Mobile Toggle */}
      <div className="sm:hidden">
        <HamburgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
      </div>

      {/* Mobile Menu Overlay */}
      {/* Mobile Menu Overlay */}
      {/* Mobile Menu Overlay */}
      {isMenuOpen && mounted && createPortal(
        <div
          className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[100] flex flex-col pt-32 px-6 gap-6 sm:hidden animate-in fade-in duration-200"
        >
          <Link
            href="/story"
            onClick={() => setIsMenuOpen(false)}
            className="text-center comic-title text-2xl text-black hover:text-rose-700 transition-colors"
          >
            KAI&apos;S STORY
          </Link>
          <Link
            href="/#ideas-section"
            onClick={() => setIsMenuOpen(false)}
            className="text-center comic-title text-2xl text-black hover:text-rose-700 transition-colors"
          >
            THIS WEEK
          </Link>

          <div className="w-full h-px bg-gray-200 my-2" />

          {isLoading ? null : user ? (
            <div className="flex flex-col items-center gap-6">
              <div onClick={() => setIsMenuOpen(false)}>
                <div className="scale-125 origin-center">
                  <BadgeDisplay />
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="text-center comic-title text-2xl text-black hover:text-rose-700 transition-colors"
              >
                PROFILE
              </Link>

              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full max-w-xs px-6 py-3 bg-black text-yellow-400 comic-title text-xl hover:bg-gray-900 transition-colors comic-shadow"
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                openAuthModal('signin');
                setIsMenuOpen(false);
              }}
              className="w-full px-6 py-4 bg-black text-yellow-400 comic-title text-xl hover:bg-gray-900 transition-colors comic-shadow"
            >
              Sign In
            </button>
          )}
        </div>,
        document.getElementById('mobile-menu-portal') || document.body
      )}
    </header>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import BadgeDisplay from './BadgeDisplay';

export default function Header({ variant = 'landing' }) {
  const { user, isLoading, signOut, openAuthModal } = useAuth();

  const isPage = variant === 'page';
  const isStory = variant === 'story';

  return (
    <header
      className={`flex items-center justify-between ${isPage ? 'bg-white border-b-4 border-black px-6 py-4' : 'mb-8'
        }`}
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

      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/story"
          className="px-3 sm:px-4 py-2 comic-title text-xs sm:text-sm text-black hover:text-rose-700 transition-colors hidden sm:block"
        >
          KAI&apos;S STORY
        </Link>
        <Link
          href="/#ideas-section"
          className="px-3 sm:px-4 py-2 comic-title text-xs sm:text-sm text-black hover:text-rose-700 transition-colors hidden sm:block"
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
    </header>
  );
}

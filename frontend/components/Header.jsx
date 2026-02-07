import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth';
import { useAnchorNavigation, scrollEasings } from '@/lib/smoothScroll';
import { motion } from 'framer-motion';
import BadgeDisplay from './ui/badge-display';
import HamburgerMenu from './HamburgerMenu';


export default function Header({ variant = 'landing' }) {
  const router = useRouter();
  const { user, isLoading, signOut, openAuthModal, closeAuthModal, openSubscribeModal, closeSubscribeModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { activeSection, scrollToAnchor } = useAnchorNavigation({
    offset: 100,
    duration: 1.4,
    easing: scrollEasings.smooth,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isStory = variant === 'story';

  // Handle smooth scroll for anchor links
  const handleAnchorClick = (e, hash) => {
    e.preventDefault();
    scrollToAnchor(hash);
    setIsMenuOpen(false);
  };

  // Handle "THIS WEEK" link - navigate to landing page first if not there
  const handleThisWeekClick = (e) => {
    e.preventDefault();
    if (router.pathname === '/') {
      // Already on landing page, just scroll
      scrollToAnchor('#ideas-section');
    } else {
      // On another page, navigate to landing page with hash
      router.push('/#ideas-section');
    }
    setIsMenuOpen(false);
  };

  // Check if a nav item is active
  const isActive = (sectionId) => activeSection === sectionId;

  return (
    <header
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[101] flex items-center justify-between w-[94%] sm:w-[92%] max-w-7xl px-3 py-2 sm:px-6 sm:py-3 bg-white border-3 sm:border-4 border-black rounded-xl sm:rounded-2xl comic-shadow"
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
          <div className="comic-title text-xl sm:text-2xl lg:text-3xl text-gray-900 tracking-widest">
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
        <a
          href="#ideas-section"
          onClick={handleThisWeekClick}
          className={`px-3 sm:px-4 py-2 comic-title text-xs sm:text-sm transition-colors ${
            isActive('ideas-section')
              ? 'text-rose-700 border-b-2 border-rose-700'
              : 'text-black hover:text-rose-700'
          }`}
        >
          THIS WEEK
        </a>
        {isLoading ? null : user ? (
          <>
            <BadgeDisplay />
            <Link
              href="/profile"
              className="px-4 py-2 comic-title text-sm text-black hover:text-rose-700 transition-colors"
            >
              PROFILE
            </Link>
            <motion.button
              whileHover={{
                x: 1,
                y: 1,
                boxShadow: "2px 2px 0px 0px #000"
              }}
              whileTap={{
                x: 3,
                y: 3,
                boxShadow: "0px 0px 0px 0px #000"
              }}
              onClick={signOut}
              className="px-4 py-2 bg-black text-yellow-400 border-2 border-black comic-title text-sm hover:bg-gray-900 shadow-[3px_3px_0px_0px_#000]"
            >
              SIGN OUT
            </motion.button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                x: 1,
                y: 1,
                boxShadow: "2px 2px 0px 0px #000"
              }}
              whileTap={{
                x: 3,
                y: 3,
                boxShadow: "0px 0px 0px 0px #000"
              }}
              className="border-2 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              <button
                onClick={() => {
                  closeAuthModal();
                  openSubscribeModal();
                }}
                className="px-4 py-2 bg-white comic-title text-sm text-black hover:bg-gray-50 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                SUBSCRIBE
              </button>
            </motion.div>

            <motion.button
              whileHover={{
                x: 1,
                y: 1,
                boxShadow: "2px 2px 0px 0px #000"
              }}
              whileTap={{
                x: 3,
                y: 3,
                boxShadow: "0px 0px 0px 0px #000"
              }}
              onClick={() => {
                closeSubscribeModal();
                openAuthModal('signin');
              }}
              className="px-4 py-2 bg-black text-yellow-400 border-2 border-black comic-title text-sm hover:bg-gray-900 shadow-[3px_3px_0px_0px_#000] flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              SIGN IN
            </motion.button>
          </div>
        )}
      </nav >

      {/* Mobile Toggle */}
      < div className="sm:hidden" >
        <HamburgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
      </div >

      {/* Mobile Menu Overlay */}
      {/* Mobile Menu Overlay */}
      {/* Mobile Menu Overlay */}
      {
        isMenuOpen && mounted && createPortal(
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
            <a
              href="#ideas-section"
              onClick={handleThisWeekClick}
              className={`text-center comic-title text-2xl transition-colors ${
                isActive('ideas-section') ? 'text-rose-700' : 'text-black hover:text-rose-700'
              }`}
            >
              THIS WEEK
            </a>

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

                <motion.button
                  whileHover={{
                    x: 2,
                    y: 2,
                    boxShadow: "4px 4px 0px 0px #000"
                  }}
                  whileTap={{
                    x: 6,
                    y: 6,
                    boxShadow: "0px 0px 0px 0px #000"
                  }}
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full max-w-xs px-6 py-3 bg-black text-yellow-400 border-3 border-black comic-title text-xl hover:bg-gray-900 shadow-[6px_6px_0px_0px_#000]"
                >
                  SIGN OUT
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col gap-8 w-full px-4 items-center">
                <motion.div
                  whileHover={{
                    x: 2,
                    y: 2,
                    boxShadow: "4px 4px 0px 0px #000"
                  }}
                  whileTap={{
                    x: 6,
                    y: 6,
                    boxShadow: "0px 0px 0px 0px #000"
                  }}
                  className="w-full max-w-xs border-3 border-black shadow-[6px_6px_0px_0px_#000]"
                >
                  <button
                    onClick={() => {
                      closeAuthModal();
                      openSubscribeModal();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-6 py-4 bg-white text-black comic-title text-xl text-center hover:bg-gray-50 flex items-center justify-center gap-3"
                  >
                    <Mail className="w-5 h-5" />
                    SUBSCRIBE
                  </button>
                </motion.div>

                <motion.button
                  whileHover={{
                    x: 2,
                    y: 2,
                    boxShadow: "4px 4px 0px 0px #000"
                  }}
                  whileTap={{
                    x: 6,
                    y: 6,
                    boxShadow: "0px 0px 0px 0px #000"
                  }}
                  onClick={() => {
                    closeSubscribeModal();
                    openAuthModal('signin');
                    setIsMenuOpen(false);
                  }}
                  className="w-full max-w-xs px-6 py-4 bg-black text-yellow-400 border-3 border-black comic-title text-xl hover:bg-gray-900 shadow-[6px_6px_0px_0px_#000] flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-5 h-5" />
                  SIGN IN
                </motion.button>
              </div>
            )}
          </div>,
          document.getElementById('mobile-menu-portal') || document.body
        )
      }
    </header >
  );
}

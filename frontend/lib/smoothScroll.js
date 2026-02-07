/**
 * Premium Lenis Smooth Scroll Configuration
 * Provides buttery-smooth scrolling with momentum physics
 */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';

const SmoothScrollContext = createContext(null);

// Premium scroll physics configuration
const SCROLL_CONFIG = {
    // Lower lerp = smoother but slower momentum (0.05-0.1 is premium feel)
    lerp: 0.075,
    // Duration affects scroll animation length
    duration: 1.2,
    // Easing function for natural deceleration
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // Wheel multiplier for desktop scroll speed
    wheelMultiplier: 0.8,
    // Touch multiplier for mobile scroll speed
    touchMultiplier: 1.5,
    // Infinite scroll disabled for standard pages
    infinite: false,
    // Smooth scroll orientation
    orientation: 'vertical',
    // Gesture orientation for touch
    gestureOrientation: 'vertical',
    // Normalize wheel delta across browsers
    normalizeWheel: true,
    // Smooth touch scrolling
    smoothTouch: false, // Disable on touch for native feel
};

// Touch device detection
const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Reduced motion preference detection
const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function SmoothScrollProvider({ children }) {
    const lenisRef = useRef(null);
    const rafRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        velocity: 0,
        direction: 0,
        progress: 0,
        isScrolling: false,
    });
    const lastDirectionRef = useRef(0);
    const dampingActiveRef = useRef(false);

    // Initialize Lenis with premium configuration
    useEffect(() => {
        // Skip smooth scroll if user prefers reduced motion
        if (prefersReducedMotion()) {
            return;
        }

        const isTouch = isTouchDevice();

        // Create Lenis instance with device-optimized settings
        const lenis = new Lenis({
            ...SCROLL_CONFIG,
            // Optimize for touch devices
            lerp: isTouch ? 0.1 : SCROLL_CONFIG.lerp,
            wheelMultiplier: isTouch ? 1 : SCROLL_CONFIG.wheelMultiplier,
            // Native touch scrolling feels better on mobile
            smoothTouch: false,
            // Sync with native scroll position
            syncTouch: true,
            syncTouchLerp: 0.075,
        });

        lenisRef.current = lenis;

        // Scroll event handler with velocity tracking
        const handleScroll = ({ velocity, direction, progress, isScrolling }) => {
            // Detect direction change for damping
            if (lastDirectionRef.current !== 0 && direction !== lastDirectionRef.current) {
                dampingActiveRef.current = true;
                // Apply subtle damping on direction change
                setTimeout(() => {
                    dampingActiveRef.current = false;
                }, 150);
            }
            lastDirectionRef.current = direction;

            setScrollState({
                velocity: Math.abs(velocity),
                direction,
                progress,
                isScrolling,
            });
        };

        lenis.on('scroll', handleScroll);

        // RAF loop for smooth animation updates
        const raf = (time) => {
            lenis.raf(time);
            rafRef.current = requestAnimationFrame(raf);
        };

        rafRef.current = requestAnimationFrame(raf);

        // Cleanup
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    // Scroll to element with smooth animation
    const scrollTo = useCallback((target, options = {}) => {
        if (!lenisRef.current) return;

        lenisRef.current.scrollTo(target, {
            offset: options.offset || 0,
            duration: options.duration || SCROLL_CONFIG.duration,
            easing: options.easing || SCROLL_CONFIG.easing,
            immediate: options.immediate || false,
            lock: options.lock || false,
            onComplete: options.onComplete,
        });
    }, []);

    // Stop scroll animation
    const stop = useCallback(() => {
        if (!lenisRef.current) return;
        lenisRef.current.stop();
    }, []);

    // Start/resume scroll
    const start = useCallback(() => {
        if (!lenisRef.current) return;
        lenisRef.current.start();
    }, []);

    // Get current scroll position
    const getScroll = useCallback(() => {
        if (!lenisRef.current) return 0;
        return lenisRef.current.scroll;
    }, []);

    // Get scroll limit (max scroll)
    const getLimit = useCallback(() => {
        if (!lenisRef.current) return 0;
        return lenisRef.current.limit;
    }, []);

    const value = {
        lenis: lenisRef.current,
        scrollTo,
        stop,
        start,
        getScroll,
        getLimit,
        ...scrollState,
    };

    return (
        <SmoothScrollContext.Provider value={value}>
            {children}
        </SmoothScrollContext.Provider>
    );
}

/**
 * Hook to access smooth scroll context
 * @returns {Object} Scroll state and methods
 */
export function useSmoothScroll() {
    const context = useContext(SmoothScrollContext);
    if (!context) {
        // Return no-op functions if not in provider (SSR safety)
        return {
            lenis: null,
            scrollTo: () => {},
            stop: () => {},
            start: () => {},
            getScroll: () => 0,
            getLimit: () => 0,
            velocity: 0,
            direction: 0,
            progress: 0,
            isScrolling: false,
        };
    }
    return context;
}

/**
 * Hook for scroll-velocity-based animations
 * @param {Object} options - Configuration options
 * @returns {Object} Velocity-based animation values
 */
export function useScrollVelocity(options = {}) {
    const { velocity, direction, isScrolling } = useSmoothScroll();
    const {
        maxVelocity = 5,
        smoothing = 0.1,
    } = options;

    const [smoothVelocity, setSmoothVelocity] = useState(0);
    const smoothVelocityRef = useRef(0);

    useEffect(() => {
        // Smooth the velocity value for animations
        const targetVelocity = Math.min(velocity, maxVelocity) / maxVelocity;
        smoothVelocityRef.current += (targetVelocity - smoothVelocityRef.current) * smoothing;
        setSmoothVelocity(smoothVelocityRef.current);
    }, [velocity, maxVelocity, smoothing]);

    return {
        velocity: smoothVelocity,
        rawVelocity: velocity,
        direction,
        isScrolling,
        // Normalized 0-1 value for animations
        intensity: Math.min(1, smoothVelocity),
    };
}

/**
 * Hook for section-specific scroll speeds
 * Use data-scroll-speed attribute on elements
 */
export function useSectionSpeed() {
    const { lenis } = useSmoothScroll();

    useEffect(() => {
        if (!lenis) return;

        // This is handled by CSS transform based on scroll position
        // Lenis provides the smooth base, sections can use CSS parallax
    }, [lenis]);
}

// Section IDs that can be navigated to
const NAVIGABLE_SECTIONS = ['ideas-section', 'final-cta', 'leaderboard'];

// Header height offset (fixed header)
const HEADER_OFFSET = 100;

// Custom easing functions for different scroll contexts
export const scrollEasings = {
    // Premium smooth easing (default)
    smooth: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // Snappy for short distances
    snappy: (t) => 1 - Math.pow(1 - t, 4),
    // Gentle for long scrolls
    gentle: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    // Bounce effect
    bounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
};

/**
 * Hook for smooth anchor link navigation
 * Handles hash links, URL updates, and section highlighting
 */
export function useAnchorNavigation(options = {}) {
    const { scrollTo, getScroll } = useSmoothScroll();
    const {
        offset = HEADER_OFFSET,
        duration = 1.4,
        easing = scrollEasings.smooth,
        updateHash = true,
    } = options;

    const [activeSection, setActiveSection] = useState(null);
    const isScrollingRef = useRef(false);

    // Scroll to anchor with smooth animation
    const scrollToAnchor = useCallback((hash, customOptions = {}) => {
        const targetId = hash.replace('#', '');
        const element = document.getElementById(targetId);

        if (!element) return false;

        isScrollingRef.current = true;

        // Calculate scroll distance for adaptive duration
        const currentScroll = getScroll();
        const elementTop = element.getBoundingClientRect().top + currentScroll;
        const distance = Math.abs(elementTop - currentScroll);

        // Adaptive duration based on distance (longer distance = slightly longer duration)
        const adaptiveDuration = customOptions.duration ||
            Math.min(2, Math.max(duration, distance / 1500));

        scrollTo(element, {
            offset: -(customOptions.offset || offset),
            duration: adaptiveDuration,
            easing: customOptions.easing || easing,
            onComplete: () => {
                isScrollingRef.current = false;

                // Update URL hash without jumping
                if (updateHash && customOptions.updateHash !== false) {
                    history.pushState(null, '', `#${targetId}`);
                }

                setActiveSection(targetId);
            },
        });

        return true;
    }, [scrollTo, getScroll, offset, duration, easing, updateHash]);

    // Handle click events on anchor links
    const handleAnchorClick = useCallback((e) => {
        const link = e.target.closest('a[href^="#"], a[href^="/#"]');
        if (!link) return;

        const href = link.getAttribute('href');
        const hash = href.includes('#') ? '#' + href.split('#')[1] : null;

        if (hash && hash.length > 1) {
            e.preventDefault();
            scrollToAnchor(hash);
        }
    }, [scrollToAnchor]);

    // Track active section based on scroll position
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateActiveSection = () => {
            if (isScrollingRef.current) return;

            const scrollPosition = window.scrollY + offset + 100;
            let currentSection = null;

            for (const sectionId of NAVIGABLE_SECTIONS) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect();
                    const elementTop = top + window.scrollY;
                    const elementBottom = bottom + window.scrollY;

                    if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
                        currentSection = sectionId;
                        break;
                    }
                }
            }

            setActiveSection(currentSection);
        };

        // Debounced scroll handler
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActiveSection();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        updateActiveSection(); // Initial check

        return () => window.removeEventListener('scroll', onScroll);
    }, [offset]);

    // Handle initial hash on page load
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            // Delay to ensure page is fully rendered
            setTimeout(() => {
                scrollToAnchor(hash, { updateHash: false });
            }, 100);
        }
    }, [scrollToAnchor]);

    // Handle browser back/forward navigation
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handlePopState = () => {
            const hash = window.location.hash;
            if (hash && hash.length > 1) {
                scrollToAnchor(hash, { updateHash: false });
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [scrollToAnchor]);

    // Attach click handler to document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, [handleAnchorClick]);

    return {
        activeSection,
        scrollToAnchor,
        scrollToSection: (sectionId, options) => scrollToAnchor(`#${sectionId}`, options),
    };
}

/**
 * Hook for programmatic scroll actions (e.g., subscribe buttons)
 */
export function useScrollActions() {
    const { scrollTo } = useSmoothScroll();

    const scrollToElement = useCallback((elementOrSelector, options = {}) => {
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;

        if (!element) return;

        scrollTo(element, {
            offset: -(options.offset || HEADER_OFFSET),
            duration: options.duration || 1.2,
            easing: options.easing || scrollEasings.smooth,
            onComplete: options.onComplete,
        });
    }, [scrollTo]);

    const scrollToTop = useCallback((options = {}) => {
        scrollTo(0, {
            duration: options.duration || 1.5,
            easing: options.easing || scrollEasings.gentle,
            onComplete: options.onComplete,
        });
    }, [scrollTo]);

    const scrollToSubscribe = useCallback((options = {}) => {
        scrollToElement('#final-cta', {
            duration: 1.6,
            easing: scrollEasings.smooth,
            ...options,
        });
    }, [scrollToElement]);

    return {
        scrollToElement,
        scrollToTop,
        scrollToSubscribe,
    };
}

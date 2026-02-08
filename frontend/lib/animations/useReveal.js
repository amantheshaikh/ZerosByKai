import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * IntersectionObserver-based reveal detection hook
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {boolean} options.once - Only trigger once
 * @param {string} options.rootMargin - Root margin for observer
 * @returns {Object} { ref, isVisible }
 */
export function useReveal({
    threshold = 0.1,
    once = true,
    rootMargin = '-50px 0px',
} = {}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    const hasTriggered = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Skip if already triggered and once is true
        if (once && hasTriggered.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    hasTriggered.current = true;
                    if (once) {
                        observer.unobserve(element);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, once, rootMargin]);

    return { ref, isVisible };
}

/**
 * Get motion props for reveal animations
 * @param {boolean} isVisible - Whether element is visible
 * @param {Object} options - Animation options
 * @returns {Object} Motion props
 */
export function useRevealMotionProps(isVisible, {
    type = 'fade',
    direction = 'up',
    delay = 0,
    duration,
    spring = 'gentle',
} = {}) {
    const { getVariant, getTransition } = require('./variants');

    const variant = getVariant(type, direction);
    const transition = getTransition(spring, delay, duration);

    return {
        initial: 'hidden',
        animate: isVisible ? 'visible' : 'hidden',
        variants: {
            hidden: variant.hidden,
            visible: {
                ...variant.visible,
                transition,
            },
        },
    };
}

/**
 * Combined hook for reveal detection + motion props
 */
export function useRevealAnimation({
    type = 'fade',
    direction = 'up',
    delay = 0,
    duration,
    spring = 'gentle',
    threshold = 0.1,
    once = true,
    rootMargin = '-50px 0px',
} = {}) {
    const { ref, isVisible } = useReveal({ threshold, once, rootMargin });
    const motionProps = useRevealMotionProps(isVisible, {
        type,
        direction,
        delay,
        duration,
        spring,
    });

    return { ref, isVisible, motionProps };
}

export default useReveal;

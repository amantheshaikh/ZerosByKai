import { useState, useEffect, useRef } from 'react';

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

export default useReveal;

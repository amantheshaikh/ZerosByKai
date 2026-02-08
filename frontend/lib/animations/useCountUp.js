import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Number counting animation hook with IntersectionObserver trigger
 * @param {Object} options
 * @param {number} options.end - Final value
 * @param {number} options.start - Starting value (default 0)
 * @param {number} options.duration - Animation duration in ms (default 2000)
 * @param {Function} options.easing - Easing function
 * @param {number} options.decimals - Decimal places to show
 * @param {boolean} options.once - Only animate once
 * @param {number} options.threshold - IntersectionObserver threshold
 * @returns {Object} { ref, value, isAnimating }
 */
export function useCountUp({
    end,
    start = 0,
    duration = 2000,
    easing = easeOutExpo,
    decimals = 0,
    once = true,
    threshold = 0.3,
} = {}) {
    const [value, setValue] = useState(start);
    const [isAnimating, setIsAnimating] = useState(false);
    const ref = useRef(null);
    const hasAnimated = useRef(false);
    const animationRef = useRef(null);

    const animate = useCallback(() => {
        if (once && hasAnimated.current) return;

        hasAnimated.current = true;
        setIsAnimating(true);

        const startTime = performance.now();
        const startValue = start;
        const endValue = end;

        const tick = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const currentValue = startValue + (endValue - startValue) * easedProgress;

            setValue(Number(currentValue.toFixed(decimals)));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                setIsAnimating(false);
                setValue(endValue);
            }
        };

        animationRef.current = requestAnimationFrame(tick);
    }, [end, start, duration, easing, decimals, once]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    animate();
                    if (once) {
                        observer.unobserve(element);
                    }
                }
            },
            { threshold }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, once, threshold]);

    return { ref, value, isAnimating };
}

// Easing functions
export function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

export function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function linear(x) {
    return x;
}

export default useCountUp;

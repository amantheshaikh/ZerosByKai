import { forwardRef } from 'react';
import { useCountUp, easeOutExpo, easeOutQuart } from '@/lib/animations/useCountUp';

/**
 * Animated number counter component
 * @param {Object} props
 * @param {number} props.value - Target value to count to
 * @param {number} props.start - Starting value (default 0)
 * @param {string} props.prefix - Text before the number
 * @param {string} props.suffix - Text after the number (e.g., '%', '+')
 * @param {number} props.duration - Animation duration in ms
 * @param {number} props.decimals - Decimal places to display
 * @param {'expo'|'quart'} props.easing - Easing function preset
 * @param {boolean} props.once - Only animate once
 * @param {number} props.threshold - Visibility threshold
 * @param {string} props.className - CSS classes
 * @param {Function} props.formatter - Custom number formatter
 */
const CountUp = forwardRef(function CountUp({
    value,
    start = 0,
    prefix = '',
    suffix = '',
    duration = 2000,
    decimals = 0,
    easing = 'expo',
    once = true,
    threshold = 0.3,
    className = '',
    formatter,
    ...rest
}, forwardedRef) {
    const easingFn = easing === 'quart' ? easeOutQuart : easeOutExpo;

    const { ref: observerRef, value: currentValue, isAnimating } = useCountUp({
        end: value,
        start,
        duration,
        easing: easingFn,
        decimals,
        once,
        threshold,
    });

    // Merge refs
    const setRefs = (node) => {
        observerRef.current = node;
        if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
                forwardedRef(node);
            } else {
                forwardedRef.current = node;
            }
        }
    };

    const displayValue = formatter
        ? formatter(currentValue)
        : currentValue.toLocaleString();

    return (
        <span
            ref={setRefs}
            className={className}
            data-animating={isAnimating}
            {...rest}
        >
            {prefix}{displayValue}{suffix}
        </span>
    );
});

export default CountUp;

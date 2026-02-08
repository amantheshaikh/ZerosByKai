import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useReveal } from '@/lib/animations/useReveal';
import { getVariant, getTransition } from '@/lib/animations/variants';

/**
 * Scroll reveal wrapper component
 * @param {Object} props
 * @param {'fade'|'slide'|'scale'|'scaleRotate'} props.type - Animation type
 * @param {'up'|'down'|'left'|'right'} props.direction - Direction for slide animations
 * @param {number} props.delay - Animation delay in seconds
 * @param {number} props.duration - Override spring duration
 * @param {'gentle'|'snappy'|'bouncy'|'smooth'} props.spring - Spring physics preset
 * @param {boolean} props.once - Only animate once (default true)
 * @param {number} props.threshold - Visibility threshold 0-1
 * @param {string} props.rootMargin - IntersectionObserver root margin
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.as - HTML element to render (default 'div')
 * @param {Object} props.hover - Hover animation props
 * @param {Object} props.tap - Tap animation props
 */
const Reveal = forwardRef(function Reveal({
    children,
    type = 'fade',
    direction = 'up',
    delay = 0,
    duration,
    spring = 'gentle',
    once = true,
    threshold = 0.1,
    rootMargin = '-50px 0px',
    className = '',
    as = 'div',
    hover,
    tap,
    ...rest
}, forwardedRef) {
    const { ref: observerRef, isVisible } = useReveal({
        threshold,
        once,
        rootMargin,
    });

    const variant = getVariant(type, direction);
    const transition = getTransition(spring, delay, duration);

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

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            ref={setRefs}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            variants={{
                hidden: variant.hidden,
                visible: {
                    ...variant.visible,
                    transition,
                },
            }}
            whileHover={hover}
            whileTap={tap}
            className={className}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
});

export default Reveal;

/**
 * Staggered container for child reveals
 */
export function RevealContainer({
    children,
    stagger = 0.1,
    once = true,
    threshold = 0.1,
    rootMargin = '-50px 0px',
    className = '',
    as = 'div',
    ...rest
}) {
    const { ref, isVisible } = useReveal({
        threshold,
        once,
        rootMargin,
    });

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            ref={ref}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: stagger,
                    },
                },
            }}
            className={className}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
}

/**
 * Child item for use inside RevealContainer
 * Does not use its own observer - relies on parent
 */
export function RevealItem({
    children,
    type = 'fade',
    direction = 'up',
    spring = 'gentle',
    className = '',
    as = 'div',
    hover,
    tap,
    ...rest
}) {
    const variant = getVariant(type, direction);
    const transition = getTransition(spring);

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            variants={{
                hidden: variant.hidden,
                visible: {
                    ...variant.visible,
                    transition,
                },
            }}
            whileHover={hover}
            whileTap={tap}
            className={className}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
}

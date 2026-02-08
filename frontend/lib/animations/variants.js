/**
 * Animation Variants for Scroll Reveal System
 * Uses spring physics for natural motion
 */

// Spring physics constants
export const springs = {
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    snappy: { type: 'spring', stiffness: 300, damping: 20 },
    bouncy: { type: 'spring', stiffness: 400, damping: 10 },
    smooth: { type: 'spring', stiffness: 100, damping: 20 },
};

// Base animation variants
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
};

export const slideInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
};

export const slideInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

export const slideInDown = {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
};

export const scaleRotate = {
    hidden: { opacity: 0, scale: 0.6, rotate: -10 },
    visible: { opacity: 1, scale: 1, rotate: 0 },
};

// Container variants for staggered children
export const staggerContainer = (staggerDelay = 0.1) => ({
    hidden: {},
    visible: {
        transition: {
            staggerChildren: staggerDelay,
        },
    },
});

// Get variant by type
export const getVariant = (type, direction) => {
    switch (type) {
        case 'fade':
            return fadeIn;
        case 'slide':
            if (direction === 'left') return slideInLeft;
            if (direction === 'right') return slideInRight;
            if (direction === 'down') return slideInDown;
            return slideInUp;
        case 'scale':
            return scaleIn;
        case 'scaleRotate':
            return scaleRotate;
        default:
            return fadeIn;
    }
};

// Get transition with delay and duration
export const getTransition = (spring = 'gentle', delay = 0, duration) => {
    const base = springs[spring] || springs.gentle;
    return {
        ...base,
        delay,
        ...(duration && { duration }),
    };
};

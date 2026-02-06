import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        query: {},
        pathname: '',
    }),
}));

// Mock Next.js head
vi.mock('next/head', () => {
    return {
        __esModule: true,
        default: ({ children }) => {
            return <div>{children}</div>;
        },
    };
});

// Mock Next.js image
vi.mock('next/image', () => {
    return {
        __esModule: true,
        // Extract priority and other Next.js specific props to avoid warnings
        default: ({ priority, fill, ...props }) => {
            // eslint-disable-next-line @next/next/no-img-element
            return <img {...props} />;
        },
    };
});

// Mock Next.js script
vi.mock('next/script', () => {
    return {
        __esModule: true,
        default: ({ children }) => {
            return <script>{children}</script>;
        },
    };
});

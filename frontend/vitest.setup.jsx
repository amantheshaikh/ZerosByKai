import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase auth helpers FIRST to prevent initialization hangs
vi.mock('@supabase/auth-helpers-nextjs', () => {
    const mockSupabaseClient = {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
            refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
        },
    };

    return {
        __esModule: true,
        createPagesBrowserClient: vi.fn(() => mockSupabaseClient),
        createPagesServerClient: vi.fn(() => mockSupabaseClient),
    };
});

// Mock Next.js router
vi.mock('next/router', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        query: {},
        pathname: '',
        events: {
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn(),
        },
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
        // Filter out Next.js-specific props to avoid React warnings
        default: ({ priority, fill, objectFit, layout, ...props }) => {
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

// Mock IdeaCarousel to prevent worker timeouts
vi.mock('@/components/IdeaCarousel', () => {
    return {
        __esModule: true,
        default: ({ ideas, onVote, getVoteButtonProps }) => {
            return (
                <div data-testid="mock-idea-carousel">
                    {ideas?.map((idea, idx) => (
                        <div key={idea.id || idx} data-testid="mock-idea-card">
                            <h3>{idea.name || idea.title}</h3>
                            <button onClick={() => onVote(idea.id)}>
                                {getVoteButtonProps ? getVoteButtonProps(idea.id).label : 'VOTE'}
                            </button>
                        </div>
                    ))}
                </div>
            );
        },
    };
});

// Mock dynamic imports that might cause timeouts
vi.mock('@/components/ui/vote-confirmation', () => {
    return {
        __esModule: true,
        default: () => <div data-testid="mock-vote-confirmation">Vote Confirmed!</div>,
    };
});

// Mock TypingAnimation to prevent animation loops
vi.mock('@/components/ui/typing-animation', () => {
    return {
        __esModule: true,
        TypingAnimation: ({ children }) => <span>{children}</span>,
    };
});

// Mock RotatingText component
vi.mock('@/components/RotatingText', () => {
    return {
        __esModule: true,
        default: ({ texts }) => <span>{texts?.[0] || 'rotating'}</span>,
    };
});

// Mock Particles component
vi.mock('@/components/Particles', () => {
    return {
        __esModule: true,
        default: () => <div data-testid="mock-particles"></div>,
    };
});

// Mock Lenis smooth scroll
vi.mock('lenis', () => {
    return {
        __esModule: true,
        default: vi.fn().mockImplementation(() => ({
            on: vi.fn(),
            off: vi.fn(),
            raf: vi.fn(),
            scrollTo: vi.fn(),
            stop: vi.fn(),
            start: vi.fn(),
            destroy: vi.fn(),
            scroll: 0,
            limit: 1000,
        })),
    };
});

vi.mock('lenis/dist/lenis.css', () => ({}));

// Mock animation components
vi.mock('@/components/animations/Reveal', () => {
    return {
        __esModule: true,
        default: ({ children, className }) => (
            <div className={className} data-testid="mock-reveal">{children}</div>
        ),
        RevealContainer: ({ children, className }) => (
            <div className={className} data-testid="mock-reveal-container">{children}</div>
        ),
        RevealItem: ({ children, className }) => (
            <div className={className} data-testid="mock-reveal-item">{children}</div>
        ),
    };
});

vi.mock('@/components/animations/CountUp', () => {
    return {
        __esModule: true,
        default: ({ value, prefix = '', suffix = '', className }) => (
            <span className={className} data-testid="mock-countup">{prefix}{value}{suffix}</span>
        ),
    };
});

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {
        // Immediately trigger as visible for tests
        this.callback([{ isIntersecting: true }]);
    }
    unobserve() {}
    disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock smooth scroll provider
vi.mock('@/lib/smoothScroll', () => {
    return {
        __esModule: true,
        SmoothScrollProvider: ({ children }) => <>{children}</>,
        useSmoothScroll: () => ({
            lenis: null,
            scrollTo: vi.fn(),
            stop: vi.fn(),
            start: vi.fn(),
            getScroll: () => 0,
            getLimit: () => 0,
            velocity: 0,
            direction: 0,
            progress: 0,
            isScrolling: false,
        }),
        useScrollVelocity: () => ({
            velocity: 0,
            rawVelocity: 0,
            direction: 0,
            isScrolling: false,
            intensity: 0,
        }),
        useAnchorNavigation: () => ({
            activeSection: null,
            scrollToAnchor: vi.fn(),
            scrollToSection: vi.fn(),
        }),
        useScrollActions: () => ({
            scrollToElement: vi.fn(),
            scrollToTop: vi.fn(),
            scrollToSubscribe: vi.fn(),
        }),
        scrollEasings: {
            smooth: (t) => t,
            snappy: (t) => t,
            gentle: (t) => t,
            bounce: (t) => t,
        },
    };
});

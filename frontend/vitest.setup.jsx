import '@testing-library/jest-dom';
import { vi } from 'vitest';

// --- Global Browser Mocks ---
class MockIntersectionObserver {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ isIntersecting: true }]); }
    unobserve() { }
    disconnect() { }
}
global.IntersectionObserver = MockIntersectionObserver;

// --- Next.js Mocks ---
vi.mock('next/router', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        query: {},
        pathname: '',
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    }),
}));

vi.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({ priority, fill, objectFit, layout, ...props }) => <img {...props} />, // eslint-disable-line @next/next/no-img-element
}));

vi.mock('next/script', () => ({
    __esModule: true,
    default: ({ children }) => <script>{children}</script>,
}));

// --- Third Party Library Mocks ---
vi.mock('@supabase/auth-helpers-nextjs', () => {
    const mockSupabaseClient = {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
            refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
    };
    return {
        __esModule: true,
        createPagesBrowserClient: vi.fn(() => mockSupabaseClient),
        createPagesServerClient: vi.fn(() => mockSupabaseClient),
    };
});

vi.mock('lenis', () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => ({
        on: vi.fn(), off: vi.fn(), raf: vi.fn(), scrollTo: vi.fn(),
        stop: vi.fn(), start: vi.fn(), destroy: vi.fn(),
        scroll: 0, limit: 1000,
    })),
}));

vi.mock('lenis/dist/lenis.css', () => ({}));

// --- Internal Component Mocks ---
vi.mock('@/components/IdeaCarousel', () => ({
    __esModule: true,
    default: ({ ideas, onVote, getVoteButtonProps }) => (
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
    ),
}));

vi.mock('@/components/ui/vote-confirmation', () => ({
    __esModule: true,
    default: () => <div data-testid="mock-vote-confirmation">Vote Confirmed!</div>,
}));

vi.mock('@/components/ui/typing-animation', () => ({
    __esModule: true,
    TypingAnimation: ({ children }) => <span>{children}</span>,
}));

vi.mock('@/components/RotatingText', () => ({
    __esModule: true,
    default: ({ texts }) => <span>{texts?.[0] || 'rotating'}</span>,
}));

vi.mock('@/components/Particles', () => ({
    __esModule: true,
    default: () => <div data-testid="mock-particles"></div>,
}));

// --- Animation Component Mocks ---
vi.mock('@/components/animations/Reveal', () => ({
    __esModule: true,
    default: ({ children, className }) => <div className={className} data-testid="mock-reveal">{children}</div>,
    RevealContainer: ({ children, className }) => <div className={className} data-testid="mock-reveal-container">{children}</div>,
    RevealItem: ({ children, className }) => <div className={className} data-testid="mock-reveal-item">{children}</div>,
}));

vi.mock('@/components/animations/CountUp', () => ({
    __esModule: true,
    default: ({ value, prefix = '', suffix = '', className }) => (
        <span className={className} data-testid="mock-countup">{prefix}{value}{suffix}</span>
    ),
}));

// --- Custom Library Mocks ---
vi.mock('@/lib/smoothScroll', () => ({
    __esModule: true,
    SmoothScrollProvider: ({ children }) => <>{children}</>,
    useSmoothScroll: () => ({
        lenis: null, scrollTo: vi.fn(), stop: vi.fn(), start: vi.fn(),
        getScroll: () => 0, getLimit: () => 0, velocity: 0, direction: 0, progress: 0, isScrolling: false,
    }),
    useScrollVelocity: () => ({ velocity: 0, rawVelocity: 0, direction: 0, isScrolling: false, intensity: 0 }),
    useAnchorNavigation: () => ({ activeSection: null, scrollToAnchor: vi.fn(), scrollToSection: vi.fn() }),
    useScrollActions: () => ({ scrollToElement: vi.fn(), scrollToTop: vi.fn(), scrollToSubscribe: vi.fn() }),
    scrollEasings: { smooth: (t) => t, snappy: (t) => t, gentle: (t) => t, bounce: (t) => t },
}));

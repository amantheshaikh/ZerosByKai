import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ZerosByKaiLanding from '../../pages/index';
import { useAuth } from '@/lib/auth';
import { fetchCurrentWeekIdeas, fetchLeaderboard, castVote, getUserVote } from '@/lib/ideas';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
    apiFetch: vi.fn(),
    getApiUrl: vi.fn(() => 'http://localhost:3001'),
}));

vi.mock('@/lib/ideas', () => ({
    fetchCurrentWeekIdeas: vi.fn(),
    fetchLeaderboard: vi.fn(),
    castVote: vi.fn(),
    getUserVote: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
    normalizeIdea: vi.fn((i) => i),
    cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileInView, viewport, ...props }) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
        h2: ({ children, whileInView, viewport, ...props }) => <h2 {...props}>{children}</h2>,
        p: ({ children, whileInView, viewport, ...props }) => <p {...props}>{children}</p>,
        span: ({ children, ...props }) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock Header, Leaderboard, IdeaCard, Footer to simplify top-level testing
vi.mock('@/components/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));
vi.mock('@/components/Leaderboard', () => ({
    default: ({ winners }) => <div data-testid="mock-leaderboard">Leaderboard: {winners?.length}</div>,
}));
vi.mock('@/components/IdeaCard', () => ({
    default: ({ idea, onVote }) => (
        <div data-testid="mock-idea-card">
            <h3>{idea.name || idea.title}</h3>
            <button onClick={() => onVote(idea.id)}>VOTE</button>
        </div>
    ),
}));
vi.mock('@/components/Footer', () => ({
    default: () => <footer data-testid="mock-footer">Footer</footer>,
}));
vi.mock('@/components/Particles', () => ({
    default: () => <div data-testid="mock-particles">Particles</div>,
}));
vi.mock('@/components/RotatingText', () => ({
    default: ({ texts }) => <div data-testid="mock-rotating-text">{texts ? texts[0] : ''}</div>,
}));
vi.mock('@/components/ui/typing-animation', () => ({
    TypingAnimation: ({ words }) => <div data-testid="mock-typing-animation">{words ? words.join(', ') : ''}</div>,
}));

describe('ZerosByKaiLanding', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockIdeas = [
        { id: 1, name: 'Idea 1', title: 'Idea 1', description: 'Desc 1' },
        { id: 2, name: 'Idea 2', title: 'Idea 2', description: 'Desc 2' },
    ];
    const mockWinners = [
        { id: '3', name: 'Winner 1', title: 'Winner 1' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            user: null,
            session: null,
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter: vi.fn(),
        });
        fetchCurrentWeekIdeas.mockResolvedValue(mockIdeas);
        fetchLeaderboard.mockResolvedValue(mockWinners);
        getUserVote.mockResolvedValue(null);
    });

    it('renders landing page with hero section', async () => {
        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            expect(screen.getAllByText(/FIND THE/i)[0]).toBeInTheDocument();
            expect(screen.getAllByText(/RIGHT/i)[0]).toBeInTheDocument();
        });

        // Ensure we wait for initial data load to avoid act() leakage
        await waitFor(() => {
            expect(fetchCurrentWeekIdeas).toHaveBeenCalled();
            expect(fetchLeaderboard).toHaveBeenCalled();
        });
    });

    it('fetches and displays ideas on mount', async () => {
        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            expect(fetchCurrentWeekIdeas).toHaveBeenCalled();
            // IdeaCarousel renders 3 cards (left, center, right) for the 3D effect
            expect(screen.getAllByTestId('mock-idea-card')).toHaveLength(3);
        });
    });

    it('handles newsletter subscription success', async () => {
        const subscribeNewsletter = vi.fn().mockResolvedValue({ success: true });
        useAuth.mockReturnValue({
            user: null,
            session: null,
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter,
        });

        render(<ZerosByKaiLanding />);

        const emailInput = screen.getAllByPlaceholderText(/your@email.com/i)[0];
        const subscribeButton = screen.getAllByRole('button', { name: /SUBSCRIBE FREE/i })[0];

        fireEvent.change(emailInput, { target: { value: 'tester@example.com' } });
        fireEvent.click(subscribeButton);

        await waitFor(() => {
            expect(subscribeNewsletter).toHaveBeenCalledWith('tester@example.com');
            expect(screen.getAllByText(/YOU'RE IN!/i)[0]).toBeInTheDocument();
        });
    });

    it('handles newsletter subscription failure', async () => {
        const subscribeNewsletter = vi.fn().mockRejectedValue(new Error('API Error'));
        useAuth.mockReturnValue({
            user: null,
            session: null,
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter,
        });

        render(<ZerosByKaiLanding />);

        const emailInput = screen.getAllByPlaceholderText(/your@email.com/i)[0];
        const subscribeButton = screen.getAllByRole('button', { name: /SUBSCRIBE FREE/i })[0];

        fireEvent.change(emailInput, { target: { value: 'tester@example.com' } });
        fireEvent.click(subscribeButton);

        await waitFor(() => {
            // Error shows up in both subscription forms
            expect(screen.getAllByText(/API Error/i)[0]).toBeInTheDocument();
        });
    });

    it('opens auth modal if unauthenticated user tries to vote', async () => {
        const openAuthModal = vi.fn();
        useAuth.mockReturnValue({
            user: null,
            session: null,
            isLoading: false,
            openAuthModal,
            subscribeNewsletter: vi.fn(),
        });

        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            const voteButtons = screen.getAllByRole('button', { name: /VOTE/i });
            fireEvent.click(voteButtons[0]);
        });

        expect(openAuthModal).toHaveBeenCalled();
    });

    it('casts vote if user is authenticated', async () => {
        const mockSession = { access_token: 'token' };
        useAuth.mockReturnValue({
            user: mockUser,
            session: mockSession,
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter: vi.fn(),
        });
        castVote.mockResolvedValue({ changedFrom: null });

        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            const voteButtons = screen.getAllByRole('button', { name: /VOTE/i });
            fireEvent.click(voteButtons[0]);
        });

        // Ensure we check the ID type correctly (received as number)
        expect(castVote).toHaveBeenCalledWith(10, mockSession);
    });
});

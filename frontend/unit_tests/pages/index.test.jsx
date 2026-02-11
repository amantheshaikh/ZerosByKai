import React from 'react';
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

// Mocks handled in setup: framer-motion, IntersectionObserver

// Mock Header, Leaderboard, IdeaCard, Footer to simplify top-level testing
vi.mock('@/components/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));
vi.mock('@/components/Leaderboard', () => ({
    default: ({ winners }) => <div data-testid="mock-leaderboard">Leaderboard: {winners?.length}</div>,
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
vi.mock('@/components/IdeaCarousel', () => ({
    default: ({ ideas, onVote, getVoteButtonProps }) => (
        <div data-testid="mock-idea-carousel">
            {ideas?.map(idea => {
                const props = getVoteButtonProps(idea.id);
                return (
                    <div key={idea.id}>
                        <h3>{idea.title}</h3>
                        <button onClick={() => onVote(idea.id)}>
                            {props.label} (VOTE)
                        </button>
                    </div>
                );
            })}
        </div>
    ),
}));
vi.mock('@/components/sections/SignalTicker', () => ({
    default: () => <div data-testid="mock-signal-ticker">SignalTicker</div>,
}));
vi.mock('@/components/sections/HowItWorks', () => ({
    default: () => <div data-testid="mock-how-it-works">HowItWorks</div>,
}));
vi.mock('@/components/sections/WhyKaiSection', () => ({
    default: () => <div data-testid="mock-why-kai">WhyKaiSection</div>,
}));
vi.mock('@/components/sections/DesignationTiers', () => ({
    default: () => <div data-testid="mock-designation-tiers">DesignationTiers</div>,
}));
vi.mock('@/components/sections/FAQSection', () => ({
    default: () => <div data-testid="mock-faq">FAQSection</div>,
}));

vi.mock('@/components/sections/FinalCTA', () => {
    return {
        default: ({ email, setEmail, subscribeStatus, subscribeError, onSubscribe }) => (
            <div data-testid="mock-final-cta">
                {subscribeStatus === 'success' ? (
                    <div>YOU'RE IN!</div>
                ) : (
                    <form onSubmit={onSubscribe}>
                        <input
                            placeholder="your@email.com"
                            value={email || ''}
                            onChange={e => setEmail(e.target.value)}
                        />
                        {subscribeError && <div>{subscribeError}</div>}
                        <button type="submit">SUBSCRIBE FREE</button>
                    </form>
                )}
            </div>
        )
    };
});

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
            profile: null,
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
            // IdeaCarousel is mocked and renders all ideas
            expect(screen.getByTestId('mock-idea-carousel')).toBeInTheDocument();
        });
    });

    it('renders with initial ISR props', () => {
        const initialIdeas = [
            { id: 99, name: 'ISR Idea', title: 'ISR Title' }
        ];
        render(<ZerosByKaiLanding initialIdeas={initialIdeas} />);

        // Should be visible immediately without waiting for fetch
        expect(screen.getByTestId('mock-idea-carousel')).toBeInTheDocument();
        // You might want to inspect the props passed to the mock if possible, 
        // or rely on the Fact that IdeaCarousel is in the document.
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

    it('shows branded error for invalid email on subscribe', async () => {
        useAuth.mockReturnValue({
            user: null,
            session: null,
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter: vi.fn(),
        });

        render(<ZerosByKaiLanding />);

        const emailInput = screen.getAllByPlaceholderText(/your@email.com/i)[0];
        const subscribeButton = screen.getAllByRole('button', { name: /SUBSCRIBE FREE/i })[0];

        // Partially valid/invalid
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(subscribeButton);

        await waitFor(() => {
            expect(screen.getAllByText(/Kai needs a real email to transmit data/i)[0]).toBeInTheDocument();
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

        // The first idea in mockIdeas has id: 1
        expect(castVote).toHaveBeenCalledWith(1, mockSession);
    });

    it('shows FinalCTA for unsubscribed authenticated user with pre-filled email', async () => {
        useAuth.mockReturnValue({
            user: { id: 'user1', email: 'test@example.com' },
            session: { access_token: 'token' },
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter: vi.fn(),
            profile: { unsubscribed_at: new Date().toISOString() }
        });

        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            const emailInputs = screen.getAllByDisplayValue('test@example.com');
            expect(emailInputs.length).toBeGreaterThan(0);
            const subscribeButtons = screen.getAllByRole('button', { name: /SUBSCRIBE FREE/i });
            expect(subscribeButtons.length).toBeGreaterThan(0);
        });
    });
    it('handles resubscription using user email without re-typing', async () => {
        const subscribeNewsletter = vi.fn().mockResolvedValue({ success: true });
        useAuth.mockReturnValue({
            user: { id: 'user1', email: 'stored@example.com' },
            session: { access_token: 'token' },
            isLoading: false,
            openAuthModal: vi.fn(),
            subscribeNewsletter,
            profile: { unsubscribed_at: '2023-01-01' },
        });

        render(<ZerosByKaiLanding />);

        await waitFor(() => {
            const subscribeButtons = screen.getAllByRole('button', { name: /SUBSCRIBE FREE/i });
            // Click the subscribe button. The handleSubscribe function should use the user props.
            fireEvent.click(subscribeButtons[0]);
        });

        await waitFor(() => {
            expect(subscribeNewsletter).toHaveBeenCalledWith('stored@example.com');
        });
    });
});

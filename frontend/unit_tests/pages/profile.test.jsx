import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../../pages/profile';
import { useAuth, apiFetch } from '@/lib/auth';
import { useRouter } from 'next/router';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
    apiFetch: vi.fn(),
}));

vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));

vi.mock('@/components/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('@/components/Footer', () => ({
    default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

describe('ProfilePage', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockSession = { access_token: 'token' };
    const mockBadges = {
        count: 5,
        tier: 'field_agent',
        badges: [
            { id: 1, idea: { name: 'Idea 1', title: 'Title 1' }, awarded_at: '2026-01-01' }
        ]
    };
    const mockVote = { vote: { idea: { name: 'Voted Idea', title: 'Voted Title' } } };
    const mockLastWeek = {
        winner: { name: 'Winner Idea', title: 'Winner Title', voteCount: 10 },
        earnedBadge: true
    };

    const mockRouter = {
        replace: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useRouter.mockReturnValue(mockRouter);
    });

    it('shows loading state initially', () => {
        useAuth.mockReturnValue({ user: null, session: null, isLoading: true });
        render(<ProfilePage />);
        expect(screen.getByText(/LOADING PROFILE.../i)).toBeInTheDocument();
    });

    it('redirects unauthenticated user to home', async () => {
        useAuth.mockReturnValue({ user: null, session: null, isLoading: false });
        render(<ProfilePage />);

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith('/');
        });
    });

    it('renders profile data when authenticated', async () => {
        useAuth.mockReturnValue({ user: mockUser, session: mockSession, isLoading: false });
        apiFetch
            .mockResolvedValueOnce(mockBadges)
            .mockResolvedValueOnce(mockVote)
            .mockResolvedValueOnce(mockLastWeek);

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
            expect(screen.getByText(/FIELD AGENT/)).toBeInTheDocument();
            expect(screen.getByText(/5 badges earned/i)).toBeInTheDocument();
        });
    });

    it('shows current week vote pick', async () => {
        useAuth.mockReturnValue({ user: mockUser, session: mockSession, isLoading: false });
        apiFetch
            .mockResolvedValueOnce(mockBadges)
            .mockResolvedValueOnce(mockVote)
            .mockResolvedValueOnce(mockLastWeek);

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Voted Idea')).toBeInTheDocument();
            expect(screen.getByText('YOUR PICK')).toBeInTheDocument();
        });
    });

    it('shows no vote message when user hasn\'t voted', async () => {
        useAuth.mockReturnValue({ user: mockUser, session: mockSession, isLoading: false });
        apiFetch
            .mockResolvedValueOnce(mockBadges)
            .mockResolvedValueOnce({ vote: null })
            .mockResolvedValueOnce(mockLastWeek);

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText(/You haven't voted this week yet/i)).toBeInTheDocument();
            expect(screen.getByText(/VOTE NOW/i)).toBeInTheDocument();
        });
    });

    it('shows last week winner and badge notification', async () => {
        useAuth.mockReturnValue({ user: mockUser, session: mockSession, isLoading: false });
        apiFetch
            .mockResolvedValueOnce(mockBadges)
            .mockResolvedValueOnce(mockVote)
            .mockResolvedValueOnce(mockLastWeek);

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Winner Idea')).toBeInTheDocument();
            expect(screen.getByText(/YOU PICKED THE WINNER!/i)).toBeInTheDocument();
        });
    });

    it('displays badge history correctly', async () => {
        useAuth.mockReturnValue({ user: mockUser, session: mockSession, isLoading: false });
        apiFetch
            .mockResolvedValueOnce(mockBadges)
            .mockResolvedValueOnce(mockVote)
            .mockResolvedValueOnce(mockLastWeek);

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Idea 1')).toBeInTheDocument();
            expect(screen.getByText('Title 1')).toBeInTheDocument();
        });
    });
});

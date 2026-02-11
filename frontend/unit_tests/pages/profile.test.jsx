import { render, waitFor, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProfilePage from '../../pages/profile';
import { useAuth, apiFetch } from '@/lib/auth';
import { useRouter } from 'next/router';

vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
    apiFetch: vi.fn(),
}));

vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));

vi.mock('next/head', () => ({
    default: ({ children }) => <>{children}</>,
}));

describe('ProfilePage', () => {
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        useRouter.mockReturnValue({ replace: mockReplace });
        useAuth.mockReturnValue({
            user: { id: 'u1', email: 'profile-test@zbk.dev' },
            session: { access_token: 'tok' },
            isLoading: false,
        });
    });

    afterEach(cleanup);

    // Helper: render and wait for loading spinner to disappear, return scoped queries
    const setup = async (apiFetchImpl) => {
        if (apiFetchImpl) apiFetch.mockImplementation(apiFetchImpl);
        const { container } = render(<ProfilePage />);
        const view = within(container);
        await waitFor(() => {
            expect(view.queryByText(/LOADING PROFILE/i)).toBeNull();
        });
        return view;
    };

    // Default apiFetch that returns full data
    const defaultApiFetch = (url) => {
        if (url.includes('/badges')) return Promise.resolve({
            count: 5,
            tier: 'field_agent',
            badges: [{ id: 1, idea: { name: 'ZBK-Badge-Idea', title: 'ZBK-Badge-Title' }, awarded_at: '2026-01-15' }],
        });
        if (url.includes('/user')) return Promise.resolve({
            vote: { idea: { name: 'ZBK-Voted-Idea', title: 'ZBK-Voted-Title' } },
        });
        if (url.includes('/last-week')) return Promise.resolve({
            winner: { name: 'ZBK-Winner-Idea', title: 'ZBK-Winner-Title', voteCount: 10 },
            earnedBadge: true,
        });
        return Promise.resolve({});
    };

    it('shows loading state initially', () => {
        useAuth.mockReturnValue({ user: null, session: null, isLoading: true });
        const { container } = render(<ProfilePage />);
        const view = within(container);
        expect(view.getByText(/LOADING PROFILE/i)).toBeTruthy();
    });

    it('redirects unauthenticated user to home', async () => {
        useAuth.mockReturnValue({ user: null, session: null, isLoading: false });
        render(<ProfilePage />);
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/');
        });
    });

    it('renders email and tier info', async () => {
        const view = await setup(defaultApiFetch);
        expect(view.getByText('profile-test@zbk.dev')).toBeTruthy();
        expect(view.getByText(/FIELD AGENT/)).toBeTruthy();
        expect(view.getByText(/5 badges earned/i)).toBeTruthy();
    });

    it('shows current week vote', async () => {
        const view = await setup(defaultApiFetch);
        expect(view.getByText('ZBK-Voted-Idea')).toBeTruthy();
        expect(view.getByText('YOUR PICK')).toBeTruthy();
    });

    it('shows no-vote prompt when user has not voted', async () => {
        const view = await setup((url) => {
            if (url.includes('/badges')) return Promise.resolve({ count: 0, tier: 'onlooker', badges: [] });
            if (url.includes('/user')) return Promise.resolve({ vote: null });
            if (url.includes('/last-week')) return Promise.resolve({ winner: null });
            return Promise.resolve({});
        });
        expect(view.getByText(/haven.t voted this week/i)).toBeTruthy();
        expect(view.getByText(/VOTE NOW/i)).toBeTruthy();
    });

    it('shows last week winner and earned badge', async () => {
        const view = await setup(defaultApiFetch);
        expect(view.getByText('ZBK-Winner-Idea')).toBeTruthy();
        expect(view.getByText(/YOU PICKED THE WINNER/i)).toBeTruthy();
    });

    it('displays badge history', async () => {
        const view = await setup(defaultApiFetch);
        expect(view.getByText('ZBK-Badge-Idea')).toBeTruthy();
        expect(view.getByText('ZBK-Badge-Title')).toBeTruthy();
    });
});

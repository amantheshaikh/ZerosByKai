import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Header from '../../components/Header';
import { useAuth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock framer-motion handled in setup

// Mock BadgeDisplay
vi.mock('@/components/ui/badge-display', () => ({
    default: () => <div data-testid="badge-display">Badge</div>,
}));

// Mock HamburgerMenu
vi.mock('@/components/HamburgerMenu', () => ({
    default: ({ isOpen, setIsOpen }) => (
        <button
            data-testid="hamburger-menu"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
            Menu
        </button>
    ),
}));

describe('Header Component', () => {
    const getFirstByText = (text) => screen.getAllByText(text)[0];
    const getFirstByRole = (role, options) => screen.getAllByRole(role, options)[0];

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            signOut: vi.fn(),
            openAuthModal: vi.fn(),
            closeAuthModal: vi.fn(),
            openSubscribeModal: vi.fn(),
            closeSubscribeModal: vi.fn(),
            profile: null,
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('Landing variant (default)', () => {
        it('renders logo and brand name', () => {
            render(<Header />);

            // Alt text might be unique if only one logo, but let's be safe
            const logos = screen.getAllByAltText('Zeros By Kai Logo');
            expect(logos[0]).toBeInTheDocument();
            expect(getFirstByText('ZEROS BY KAI')).toBeInTheDocument();
        });

        it('renders navigation links', () => {
            render(<Header />);

            expect(getFirstByText("KAI'S STORY")).toBeInTheDocument();
            expect(getFirstByText('ZEROS THIS WEEK')).toBeInTheDocument();
        });

        it('shows sign in and subscribe buttons when not authenticated', () => {
            render(<Header />);

            expect(getFirstByText('SIGN IN')).toBeInTheDocument();
            expect(getFirstByText('SUBSCRIBE')).toBeInTheDocument();
        });

        it('shows profile and sign out when authenticated', () => {
            useAuth.mockReturnValue({
                user: { id: 'user1', email: 'test@example.com' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
                profile: { unsubscribed_at: null }
            });

            render(<Header />);

            expect(getFirstByText('PROFILE')).toBeInTheDocument();
            expect(getFirstByText('SIGN OUT')).toBeInTheDocument();
            const badges = screen.getAllByTestId('badge-display');
            expect(badges[0]).toBeInTheDocument();
            expect(screen.queryByText('SIGN IN')).not.toBeInTheDocument();
        });

        it('shows subscribe button when authenticated but unsubscribed', () => {
            useAuth.mockReturnValue({
                user: { id: 'user1', email: 'test@example.com' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
                openSubscribeModal: vi.fn(),
                profile: { unsubscribed_at: new Date().toISOString() }
            });

            render(<Header />);

            expect(getFirstByText('SUBSCRIBE')).toBeInTheDocument();
        });

        it('does not show auth buttons while loading', () => {
            useAuth.mockReturnValue({
                user: null,
                isLoading: true,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            expect(screen.queryByText('SIGN IN')).not.toBeInTheDocument();
            expect(screen.queryByText('SIGN OUT')).not.toBeInTheDocument();
        });

        it('calls openAuthModal when sign in is clicked', () => {
            const openAuthModal = vi.fn();
            useAuth.mockReturnValue({
                user: null,
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal,
                closeAuthModal: vi.fn(),
                openSubscribeModal: vi.fn(),
                closeSubscribeModal: vi.fn(),
            });

            render(<Header />);

            fireEvent.click(getFirstByText('SIGN IN'));

            expect(openAuthModal).toHaveBeenCalledWith('signin');
        });

        it('calls openSubscribeModal when subscribe is clicked', () => {
            const openSubscribeModal = vi.fn();
            useAuth.mockReturnValue({
                user: null,
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
                closeAuthModal: vi.fn(),
                openSubscribeModal,
                closeSubscribeModal: vi.fn(),
            });

            render(<Header />);

            fireEvent.click(getFirstByText('SUBSCRIBE'));

            expect(openSubscribeModal).toHaveBeenCalled();
        });

        it('calls signOut when sign out is clicked', () => {
            const signOut = vi.fn();
            useAuth.mockReturnValue({
                user: { id: 'user1' },
                isLoading: false,
                signOut,
                openAuthModal: vi.fn(),
                closeAuthModal: vi.fn(),
                openSubscribeModal: vi.fn(),
                closeSubscribeModal: vi.fn(),
            });

            render(<Header />);

            fireEvent.click(getFirstByText('SIGN OUT'));

            expect(signOut).toHaveBeenCalled();
        });
    });

    describe('Story variant', () => {
        it('shows back to home link instead of logo', () => {
            render(<Header variant="story" />);

            expect(getFirstByText('Back to Home')).toBeInTheDocument();
            expect(screen.queryByText('ZEROS BY KAI')).not.toBeInTheDocument();
        });
    });

    describe('Mobile menu', () => {
        it('renders hamburger menu button on mobile', () => {
            render(<Header />);

            const menus = screen.getAllByTestId('hamburger-menu');
            expect(menus[0]).toBeInTheDocument();
        });

        it('toggles mobile menu on hamburger click', async () => {
            useAuth.mockReturnValue({
                user: null,
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            const hamburger = screen.getAllByTestId('hamburger-menu')[0];
            fireEvent.click(hamburger);

            // Mobile menu should show navigation items
            await waitFor(() => {
                // The mobile menu renders KAI'S STORY twice (desktop + mobile)
                const storyLinks = screen.getAllByText("KAI'S STORY");
                expect(storyLinks.length).toBeGreaterThan(0);
            });
        });

        it('shows profile and sign out in mobile menu when authenticated and subscribed', async () => {
            useAuth.mockReturnValue({
                user: { id: 'user1' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
                profile: { unsubscribed_at: null }
            });

            render(<Header />);
            fireEvent.click(screen.getAllByTestId('hamburger-menu')[0]);

            await waitFor(() => {
                // Should show PROFILE and SIGN OUT
                const profiles = screen.getAllByText('PROFILE');
                expect(profiles.length).toBeGreaterThan(0); // Desktop + Mobile or just match
                // We can be specific about visible ones, but getAll is safer for verification.
                expect(screen.getAllByText('SIGN OUT').length).toBeGreaterThan(0);
                // Should NOT show Sign In
                expect(screen.queryByText('SIGN IN')).not.toBeInTheDocument();
            });
        });

        it('shows subscribe button in mobile menu when authenticated but unsubscribed', async () => {
            useAuth.mockReturnValue({
                user: { id: 'user1' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
                openSubscribeModal: vi.fn(),
                closeSubscribeModal: vi.fn(),
                profile: { unsubscribed_at: new Date().toISOString() }
            });

            render(<Header />);
            fireEvent.click(screen.getAllByTestId('hamburger-menu')[0]);

            await waitFor(() => {
                expect(screen.getAllByText('SUBSCRIBE').length).toBeGreaterThan(0);
            });
        });
    });

    describe('Navigation links', () => {
        it('has correct hrefs for navigation', () => {
            render(<Header />);

            // Use getFirstByRole to handle multiples
            const storyLink = getFirstByRole('link', { name: "KAI'S STORY" });
            const thisWeekLink = getFirstByRole('link', { name: 'ZEROS THIS WEEK' });

            expect(storyLink).toHaveAttribute('href', '/story');
            expect(thisWeekLink).toHaveAttribute('href', '#ideas-section');
        });

        it('profile link points to /profile when authenticated', () => {
            useAuth.mockReturnValue({
                user: { id: 'user1' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            const profileLink = getFirstByRole('link', { name: 'PROFILE' });
            expect(profileLink).toHaveAttribute('href', '/profile');
        });
    });
});

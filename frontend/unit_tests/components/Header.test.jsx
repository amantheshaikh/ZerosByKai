import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '../../components/Header';
import { useAuth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
    const filterMotionProps = (props) => {
        const {
            whileHover,
            whileTap,
            initial,
            animate,
            exit,
            variants,
            transition,
            ...rest
        } = props;
        return rest;
    };

    return {
        motion: {
            div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
            button: ({ children, ...props }) => <button {...filterMotionProps(props)}>{children}</button>,
        },
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

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
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            signOut: vi.fn(),
            openAuthModal: vi.fn(),
        });
    });

    describe('Landing variant (default)', () => {
        it('renders logo and brand name', () => {
            render(<Header />);

            expect(screen.getByAltText('ZerosByKai Logo')).toBeInTheDocument();
            expect(screen.getByText('ZEROS BY KAI')).toBeInTheDocument();
        });

        it('renders navigation links', () => {
            render(<Header />);

            expect(screen.getByText("KAI'S STORY")).toBeInTheDocument();
            expect(screen.getByText('THIS WEEK')).toBeInTheDocument();
        });

        it('shows sign in and subscribe buttons when not authenticated', () => {
            render(<Header />);

            expect(screen.getByText('SIGN IN')).toBeInTheDocument();
            expect(screen.getByText('SUBSCRIBE')).toBeInTheDocument();
        });

        it('shows profile and sign out when authenticated', () => {
            useAuth.mockReturnValue({
                user: { id: 'user1', email: 'test@example.com' },
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            expect(screen.getByText('PROFILE')).toBeInTheDocument();
            expect(screen.getByText('SIGN OUT')).toBeInTheDocument();
            expect(screen.getByTestId('badge-display')).toBeInTheDocument();
            expect(screen.queryByText('SIGN IN')).not.toBeInTheDocument();
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
            });

            render(<Header />);

            fireEvent.click(screen.getByText('SIGN IN'));

            expect(openAuthModal).toHaveBeenCalledWith('signin');
        });

        it('calls signOut when sign out is clicked', () => {
            const signOut = vi.fn();
            useAuth.mockReturnValue({
                user: { id: 'user1' },
                isLoading: false,
                signOut,
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            fireEvent.click(screen.getByText('SIGN OUT'));

            expect(signOut).toHaveBeenCalled();
        });
    });

    describe('Story variant', () => {
        it('shows back to home link instead of logo', () => {
            render(<Header variant="story" />);

            expect(screen.getByText('Back to Home')).toBeInTheDocument();
            expect(screen.queryByText('ZEROS BY KAI')).not.toBeInTheDocument();
        });
    });

    describe('Mobile menu', () => {
        it('renders hamburger menu button on mobile', () => {
            render(<Header />);

            expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
        });

        it('toggles mobile menu on hamburger click', async () => {
            useAuth.mockReturnValue({
                user: null,
                isLoading: false,
                signOut: vi.fn(),
                openAuthModal: vi.fn(),
            });

            render(<Header />);

            const hamburger = screen.getByTestId('hamburger-menu');
            fireEvent.click(hamburger);

            // Mobile menu should show navigation items
            await waitFor(() => {
                // The mobile menu renders KAI'S STORY twice (desktop + mobile)
                const storyLinks = screen.getAllByText("KAI'S STORY");
                expect(storyLinks.length).toBeGreaterThan(1);
            });
        });
    });

    describe('Navigation links', () => {
        it('has correct hrefs for navigation', () => {
            render(<Header />);

            const storyLink = screen.getByRole('link', { name: "KAI'S STORY" });
            const thisWeekLink = screen.getByRole('link', { name: 'THIS WEEK' });

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

            const profileLink = screen.getByRole('link', { name: 'PROFILE' });
            expect(profileLink).toHaveAttribute('href', '/profile');
        });
    });
});

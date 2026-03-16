import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoastPage from '../../pages/roast';
import { useAuth, apiFetch } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn(),
  apiFetch: vi.fn(() => Promise.resolve({ roasts: [], hasMore: false })),
}));

// Mock framer-motion to disable animations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock next/head
vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Flame: () => <div data-testid="icon-flame" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
  Eye: () => <div data-testid="icon-eye" />,
  EyeOff: () => <div data-testid="icon-eye-off" />,
  Skull: () => <div data-testid="icon-skull" />,
  Zap: () => <div data-testid="icon-zap" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  Lightbulb: () => <div data-testid="icon-lightbulb" />,
  Target: () => <div data-testid="icon-target" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  ChevronUp: () => <div data-testid="icon-chevron-up" />,
  Users: () => <div data-testid="icon-users" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}));

// Mock local sections/components to avoid deep rendering issues
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="mock-header">Header</div>
}));
vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="mock-footer">Footer</div>
}));
vi.mock('@/components/sections/FAQSection', () => ({
  default: () => <div data-testid="mock-faq">FAQ</div>
}));
vi.mock('@/components/sections/HowItWorks', () => ({
  default: () => <div data-testid="mock-how-it-works">How It Works</div>
}));
vi.mock('@/components/HallOfShame', () => ({
  default: () => <div data-testid="mock-hall-of-shame">Hall of Shame</div>
}));
// Mock RoastResults since it's a large purely-visual component
vi.mock('@/components/RoastResults', () => ({
  default: ({ roastData }) => (
    <div data-testid="mock-roast-results">
      <h3>KAI'S ROAST REPORT</h3>
      <p>{roastData.roast.verdict}</p>
    </div>
  )
}));

describe('RoastPage', () => {
  const mockUser = { id: 'user1', email: 'test@example.com' };
  const mockSession = { access_token: 'valid-token' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      openAuthModal: vi.fn(),
      showAuthModal: false,
    });
  });

  it('renders initial state correctly', async () => {
    render(<RoastPage />);
    await waitFor(() => {
        expect(screen.getAllByText(/YOUR IDEA/i)[0]).toBeInTheDocument();
    });
    expect(screen.getAllByText(/PROBABLY SUCKS/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What problem does it solve/i)).toBeInTheDocument();
  });

  it('updates textarea value when typing', async () => {
    render(<RoastPage />);
    await waitFor(() => {
        expect(screen.getByPlaceholderText(/What problem does it solve/i)).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText(/What problem does it solve/i);
    fireEvent.change(textarea, { target: { value: 'A revolutionary new toaster' } });
    expect(textarea.value).toBe('A revolutionary new toaster');
  });

  it('triggers auth modal for unauthenticated submissions', async () => {
    const openAuthModal = vi.fn();
    useAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      openAuthModal,
      showAuthModal: false,
    });

    render(<RoastPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/What problem does it solve/i)).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText(/What problem does it solve/i);
    fireEvent.change(textarea, { target: { value: 'A very long and interesting startup idea that Kai will surely hate.' } });
    
    const submitBtn = screen.getByRole('button', { name: /ROAST ME NOW/i });
    fireEvent.click(submitBtn);

    expect(openAuthModal).toHaveBeenCalledWith('signin');
  });

  it('submits roast successfully when authenticated', async () => {
    useAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      isLoading: false,
      openAuthModal: vi.fn(),
      showAuthModal: false,
    });

    const mockRoastResponse = {
      idea: 'My Uber for Dogs idea',
      roast: {
        roast_score: 2,
        verdict: 'This is a disaster.',
        what_went_wrong: ['No market', 'High liability'],
        who_already_did_it: 'DogWalker.com',
        founder_archetype: 'The Dreamer',
        survivability: 'Very low',
        one_real_advice: 'Maybe try something else.',
        closing_burn: 'Good luck, you\'ll need it.'
      }
    };

    apiFetch.mockResolvedValue(mockRoastResponse);

    render(<RoastPage />);
    const textarea = screen.getByPlaceholderText(/What problem does it solve/i);
    fireEvent.change(textarea, { target: { value: 'Uber for Dogs is the future of pet transportation.' } });

    const submitBtn = screen.getByRole('button', { name: /ROAST ME NOW/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/ROASTING.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/roast',
        expect.objectContaining({ method: 'POST' }),
        mockSession
      );
      expect(screen.getByText(/KAI'S ROAST REPORT/i)).toBeInTheDocument();
      expect(screen.getByText(/This is a disaster/i)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    useAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      isLoading: false,
      openAuthModal: vi.fn(),
      showAuthModal: false,
    });

    apiFetch.mockRejectedValue(new Error('Internal Server Error'));

    render(<RoastPage />);
    const textarea = screen.getByPlaceholderText(/What problem does it solve/i);
    fireEvent.change(textarea, { target: { value: 'An idea that will fail the API call.' } });

    const submitBtn = screen.getByRole('button', { name: /ROAST ME NOW/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    // Verify retry works
    apiFetch.mockResolvedValue({
      idea: 'Test Idea',
      roast: { roast_score: 5, verdict: 'Success after retry', what_went_wrong: [] }
    });

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText(/Success after retry/i)).toBeInTheDocument();
    });
  });

  it('resets form when clicking "ROAST ANOTHER"', async () => {
    useAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      isLoading: false,
      openAuthModal: vi.fn(),
      showAuthModal: false,
    });

    apiFetch.mockResolvedValue({
      idea: 'Test Idea',
      roast: {
        roast_score: 5,
        verdict: 'Meh.',
        what_went_wrong: [],
        who_already_did_it: '',
        founder_archetype: '',
        survivability: '',
        one_real_advice: '',
        closing_burn: ''
      }
    });

    render(<RoastPage />);
    fireEvent.change(screen.getByPlaceholderText(/What problem does it solve/i), { target: { value: 'Valid idea content here.' } });
    fireEvent.click(screen.getByRole('button', { name: /ROAST ME NOW/i }));

    await waitFor(() => {
      expect(screen.getByText(/ROAST ANOTHER/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ROAST ANOTHER/i }));

    expect(screen.getByPlaceholderText(/What problem does it solve/i)).toBeInTheDocument();
    expect(screen.queryByText(/KAI'S ROAST REPORT/i)).not.toBeInTheDocument();
  });
});

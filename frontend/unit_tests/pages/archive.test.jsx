import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ArchivePage from '../../pages/archive';
import { fetchArchiveBatches } from '@/lib/ideas';

// Mock dependencies
vi.mock('@/lib/ideas', () => ({
    fetchArchiveBatches: vi.fn(),
}));

vi.mock('@/components/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('@/components/Footer', () => ({
    default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Award: () => <div data-testid="award-icon" />,
    ChevronDown: () => <div data-testid="chevron-down-icon" />,
    ChevronUp: () => <div data-testid="chevron-up-icon" />,
}));

describe('ArchivePage', () => {
    const mockBatches = [
        {
            id: 'batch1',
            week_start_date: '2026-01-05',
            total_votes: 100,
            winner: {
                id: 'winner1',
                name: 'Winning Idea',
                title: 'Winning Title',
                problem: 'Problem description',
                solution: 'Solution description',
                tagsList: ['AI', 'SaaS']
            },
            ideas: [
                {
                    id: 'winner1',
                    name: 'Winning Idea',
                    title: 'Winning Title',
                    problem: 'Problem description',
                    solution: 'Solution description',
                    tagsList: ['AI', 'SaaS']
                },
                {
                    id: 'idea2',
                    name: 'Second Idea',
                    title: 'Second Title',
                    problem: 'Problem 2',
                    solution: 'Solution 2',
                    tagsList: ['Web']
                }
            ]
        }
    ];

    const mockPagination = { pages: 3 };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('shows loading state initially', () => {
        fetchArchiveBatches.mockReturnValue(new Promise(() => { })); // Never resolves
        render(<ArchivePage />);
        expect(screen.getByText(/LOADING ARCHIVE.../i)).toBeInTheDocument();
    });

    it('renders archive batches correctly', async () => {
        fetchArchiveBatches.mockResolvedValue({ batches: mockBatches, pagination: mockPagination });
        render(<ArchivePage />);

        await waitFor(() => {
            expect(screen.getByText(/WEEK OF JANUARY 5, 2026/i)).toBeInTheDocument();
            expect(screen.getByText('Winning Idea')).toBeInTheDocument();
            expect(screen.getByText(/100 total votes/i)).toBeInTheDocument();
        });
    });

    it('toggles week ideas visibility', async () => {
        fetchArchiveBatches.mockResolvedValue({ batches: mockBatches, pagination: mockPagination });
        render(<ArchivePage />);

        await waitFor(() => {
            const toggleButton = screen.getByText(/SHOW ALL 2 IDEAS FROM THIS WEEK/i);
            fireEvent.click(toggleButton);
        });

        expect(screen.getByText(/HIDE ALL 2 IDEAS FROM THIS WEEK/i)).toBeInTheDocument();
        expect(screen.getByText('Second Idea')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/HIDE ALL 2 IDEAS FROM THIS WEEK/i));
        expect(screen.queryByText('Second Idea')).not.toBeInTheDocument();
    });

    it('handles pagination', async () => {
        fetchArchiveBatches.mockResolvedValue({ batches: mockBatches, pagination: mockPagination });
        render(<ArchivePage />);

        await waitFor(() => {
            const nextButton = screen.getByText(/NEXT →/i);
            fireEvent.click(nextButton);
        });

        expect(fetchArchiveBatches).toHaveBeenCalledWith(2, 20);
    });

    it('shows empty state when no batches are found', async () => {
        fetchArchiveBatches.mockResolvedValue({ batches: [], pagination: { pages: 0 } });
        render(<ArchivePage />);

        await waitFor(() => {
            expect(screen.getByText(/NO PAST WEEKS YET/i)).toBeInTheDocument();
        });
    });
});

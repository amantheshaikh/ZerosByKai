import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SecretStash from '../../pages/tools';
// We import TOOLS to use in tests, but it will be the mocked version
import { TOOLS } from '@/lib/stash-data';

// Mock dependencies
// Mocks handled in setup: framer-motion, next/head

vi.mock('../../components/Header', () => ({
    default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/Footer', () => ({
    default: () => <div data-testid="footer">Footer</div>,
}));

// Mock stash-data inline to avoid hoisting issues
vi.mock('@/lib/stash-data', async () => {
    return {
        TOOLS: [
            {
                id: 1,
                name: 'Mock Tool 1',
                category: 'Hosting',
                hook: 'Mock Hook 1',
                features: ['Feature A', 'Feature B'],
                perfectFor: 'Mock Usage',
                cost: 'Free',
                url: 'https://example.com/1',
                detailedDescription: 'Mock Description 1',
                bestFor: 'Mock Best For 1',
                notGoodFor: 'Mock Not Good For 1',
                keyDifferentiator: 'Mock Diff 1'
            },
            {
                id: 2,
                name: 'Mock Tool 2',
                category: 'Database', // Different category for filter test
                hook: 'Mock Hook 2',
                features: ['Feature C'],
                perfectFor: 'Mock Usage 2',
                cost: 'Paid',
                url: 'https://example.com/2',
                detailedDescription: 'Mock Description 2',
                bestFor: 'Mock Best For 2',
                notGoodFor: 'Mock Not Good For 2',
                keyDifferentiator: 'Mock Diff 2'
            }
        ],
        CATEGORIES: [
            { id: 'hosting', name: 'Hosting', icon: 'H', description: 'Hosting Desc' },
            { id: 'database', name: 'Database', icon: 'D', description: 'Database Desc' },
        ],
        CATEGORY_COLORS: {},
    };
});

describe('SecretStash (Tools Page)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the page rendering hero section', () => {
        render(<SecretStash />);
        expect(screen.getByRole('heading', { name: /SECRET STASH/i })).toBeInTheDocument();
        expect(screen.getByText(/FROM 0 TO 1 IN \$0/i)).toBeInTheDocument();
    });

    it('renders the list of tools', () => {
        render(<SecretStash />);
        expect(screen.getAllByText('Mock Tool 1')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Mock Tool 2')[0]).toBeInTheDocument();
    });

    it('filters tools by category', async () => {
        render(<SecretStash />);

        // Click 'Hosting' category
        const hostingCategoryButton = screen.getByText(/Hosting \(/i);
        fireEvent.click(hostingCategoryButton);

        // Verify Mock Tool 1 (Hosting) is shown
        expect(screen.getByText('Mock Tool 1')).toBeInTheDocument();

        // Verify Mock Tool 2 (Database) is NOT shown
        expect(screen.queryByText('Mock Tool 2')).not.toBeInTheDocument();
    });

    it('filters tools by search query', async () => {
        render(<SecretStash />);

        const searchInput = screen.getByPlaceholderText(/Search tools.../i);

        fireEvent.change(searchInput, { target: { value: 'Mock Tool 2' } });

        expect(screen.getByText('Mock Tool 2')).toBeInTheDocument();
        expect(screen.queryByText('Mock Tool 1')).not.toBeInTheDocument();
    });

    it('shows "No tools found" for invalid search', async () => {
        render(<SecretStash />);

        const searchInput = screen.getByPlaceholderText(/Search tools.../i);
        fireEvent.change(searchInput, { target: { value: 'xyz_non_existent' } });

        // Use getAllByText in case there's multiple or just relaxed match
        await waitFor(() => {
            expect(screen.getByText(/NO TOOLS FOUND/i)).toBeInTheDocument();
        });
    });

    it('opens tool detail modal when clicking DEETS button', async () => {
        render(<SecretStash />);

        // Using getAllByText because "DEETS" appears on every card
        // We act on the first one (Mock Tool 1)
        const deetsButtons = screen.getAllByText(/DEETS/i);
        fireEvent.click(deetsButtons[0]);

        await waitFor(() => {
            // Check for detailed description which is unique to modal
            expect(screen.getByText('Mock Description 1')).toBeInTheDocument();
            // Check for VISIT buttons - there should correspond to the tool
            // Card has "VISIT", Modal has "VISIT Mock Tool 1"
            expect(screen.getByRole('link', { name: /VISIT Mock Tool 1/i })).toBeInTheDocument();
        });
    });

    it('shows category description when a specific category is selected', async () => {
        render(<SecretStash />);
        const hostingCategoryButton = screen.getByText(/Hosting \(/i);
        fireEvent.click(hostingCategoryButton);

        await waitFor(() => {
            expect(screen.getByText(/Hosting Desc/i)).toBeInTheDocument();
        });
    });

    it('closes modal on Escape key press', async () => {
        render(<SecretStash />);
        const deetsButtons = screen.getAllByText(/DEETS/i);
        fireEvent.click(deetsButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Mock Description 1')).toBeInTheDocument();
        });

        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByText('Mock Description 1')).not.toBeInTheDocument();
        });
    });

    it('renders cost badges with correct styling', () => {
        render(<SecretStash />);
        const freeBadge = screen.getByText('Free');
        const paidBadge = screen.getByText('Paid');

        // Check classes if possible, or just presence
        // Note: tailwind classes might be hard to test exactly without checking classList
        expect(freeBadge.className).toContain('bg-green-100');
        expect(paidBadge.className).toContain('bg-yellow-100');
    });

    it('handles image load error in ToolLogo by hiding the image', async () => {
        render(<SecretStash />);
        // Find an image. The mock data has url 'https://example.com/1'
        // host is example.com.
        // ToolLogo alt is "Mock Tool 1 logo"

        await waitFor(() => {
            const logo = screen.getByAltText('Mock Tool 1 logo');
            fireEvent.error(logo);
            // Logic: setError(true) -> returns null (removes from DOM)
        });

        await waitFor(() => {
            expect(screen.queryByAltText('Mock Tool 1 logo')).not.toBeInTheDocument();
        });
    });

    it('toggles FAQ items', async () => {
        render(<SecretStash />);

        const question = "Is it actually possible to build a SaaS for $0?";
        const answerFragment = "This stash is designed to help you build an MVP";

        const questionButton = screen.getByText(question);

        // Click to open
        fireEvent.click(questionButton);

        await waitFor(() => {
            expect(screen.getByText(new RegExp(answerFragment, 'i'))).toBeVisible();
        });

        // Click to close
        fireEvent.click(questionButton);

        // Wait for removal or invisibility
        await waitFor(() => {
            expect(screen.queryByText(new RegExp(answerFragment, 'i'))).not.toBeInTheDocument();
        });
    });
});


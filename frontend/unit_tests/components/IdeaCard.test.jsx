import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IdeaCard from '../../components/IdeaCard';

describe('IdeaCard Component', () => {
    const mockIdea = {
        id: 1,
        name: 'Test Idea',
        title: 'One-liner description',
        problem: 'This is the problem statement',
        solution: 'This is the solution',
        why_it_matters: 'Big market opportunity',
        target: 'Developers and startups',
        tagsList: ['Tech', 'SaaS'],
    };

    const defaultProps = {
        idea: mockIdea,
        index: 0,
        isUserPick: false,
        btnProps: { label: 'VOTE FOR THIS', style: 'bg-rose-500 text-white' },
        votingIdeaId: null,
        onVote: vi.fn(),
    };

    const getFirstByText = (text) => screen.getAllByText(text)[0];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Rendering', () => {
        it('renders idea name and title', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('Test Idea')).toBeInTheDocument();
            expect(getFirstByText('One-liner description')).toBeInTheDocument();
        });

        it('renders index number correctly', () => {
            render(<IdeaCard {...defaultProps} index={2} />);

            expect(getFirstByText('#3')).toBeInTheDocument();
        });

        it('renders problem section', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('THE PROBLEM')).toBeInTheDocument();
            expect(getFirstByText('This is the problem statement')).toBeInTheDocument();
        });

        it('renders solution section', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('THE FIX')).toBeInTheDocument();
            expect(getFirstByText('This is the solution')).toBeInTheDocument();
        });

        it('renders market potential with trailing period', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('MARKET POTENTIAL')).toBeInTheDocument();
            expect(getFirstByText('Big market opportunity.')).toBeInTheDocument();
        });

        it('renders target audience with trailing period', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('TARGET AUDIENCE')).toBeInTheDocument();
            expect(getFirstByText('Developers and startups.')).toBeInTheDocument();
        });

        it('renders tags', () => {
            render(<IdeaCard {...defaultProps} />);

            expect(getFirstByText('TECH')).toBeInTheDocument();
            expect(getFirstByText('SAAS')).toBeInTheDocument();
        });

        it('limits tags to 4 maximum', () => {
            const manyTagsIdea = {
                ...mockIdea,
                tagsList: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag6'],
            };

            render(<IdeaCard {...defaultProps} idea={manyTagsIdea} />);

            expect(getFirstByText('TAG1')).toBeInTheDocument();
            expect(getFirstByText('TAG4')).toBeInTheDocument();
            expect(screen.queryByText('TAG5')).not.toBeInTheDocument();
        });
    });

    describe('User Pick state', () => {
        it('shows YOUR PICK badge when isUserPick is true', () => {
            render(<IdeaCard {...defaultProps} isUserPick={true} />);

            expect(screen.getAllByText(/YOUR PICK/)[0]).toBeInTheDocument();
        });

        it('does not show YOUR PICK badge when isUserPick is false', () => {
            render(<IdeaCard {...defaultProps} isUserPick={false} />);

            expect(screen.queryByText(/YOUR PICK/)).not.toBeInTheDocument();
        });

        it('has ring highlight when isUserPick is true', () => {
            const { container } = render(<IdeaCard {...defaultProps} isUserPick={true} />);

            const panel = container.querySelector('.comic-panel');
            expect(panel).toHaveClass('ring-4', 'ring-yellow-400');
        });
    });

    describe('Vote button', () => {
        it('renders vote button with provided label', () => {
            render(<IdeaCard {...defaultProps} />);

            // Role queries are usually safer against duplicates if accessible properly, but let's be consistent if needed.
            // getAllByRole matches multiple buttons if multiple cards are rendered? But here we render ONE.
            // If duplicates exist, getAllByRole is needed.
            const buttons = screen.getAllByRole('button', { name: 'VOTE FOR THIS' });
            expect(buttons[0]).toBeInTheDocument();
        });

        it('shows default label when btnProps.label is missing', () => {
            render(<IdeaCard {...defaultProps} btnProps={{}} />);

            const buttons = screen.getAllByRole('button', { name: 'VOTE FOR THIS' });
            expect(buttons[0]).toBeInTheDocument();
        });

        it('calls onVote with idea id when clicked', () => {
            const onVote = vi.fn();
            render(<IdeaCard {...defaultProps} onVote={onVote} />);

            const buttons = screen.getAllByRole('button', { name: 'VOTE FOR THIS' });
            fireEvent.click(buttons[0]);

            expect(onVote).toHaveBeenCalledWith(1);
        });

        it('shows loading state when voting is in progress', () => {
            render(<IdeaCard {...defaultProps} votingIdeaId={1} />);

            const buttons = screen.getAllByRole('button', { name: 'VOTE...' });
            expect(buttons[0]).toBeInTheDocument();
        });

        it('disables button when voting is in progress', () => {
            render(<IdeaCard {...defaultProps} votingIdeaId={1} />);

            const buttons = screen.getAllByRole('button', { name: 'VOTE...' });
            expect(buttons[0]).toBeDisabled();
        });

        it('is not disabled when different idea is voting', () => {
            render(<IdeaCard {...defaultProps} votingIdeaId={999} />);

            const buttons = screen.getAllByRole('button', { name: 'VOTE FOR THIS' });
            expect(buttons[0]).not.toBeDisabled();
        });

        it('stops event propagation on click', () => {
            const onVote = vi.fn();
            const parentClick = vi.fn();

            render(
                <div onClick={parentClick}>
                    <IdeaCard {...defaultProps} onVote={onVote} />
                </div>
            );

            const buttons = screen.getAllByRole('button', { name: 'VOTE FOR THIS' });
            fireEvent.click(buttons[0]);

            expect(onVote).toHaveBeenCalled();
            expect(parentClick).not.toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('handles missing why_it_matters with fallback to why', () => {
            const ideaWithWhy = {
                ...mockIdea,
                why_it_matters: undefined,
                why: 'Fallback why text',
            };

            render(<IdeaCard {...defaultProps} idea={ideaWithWhy} />);

            expect(getFirstByText('Fallback why text.')).toBeInTheDocument();
        });

        it('handles empty tagsList', () => {
            const ideaNoTags = { ...mockIdea, tagsList: [] };

            render(<IdeaCard {...defaultProps} idea={ideaNoTags} />);

            // Should not crash, just render no tags
            expect(getFirstByText('Test Idea')).toBeInTheDocument();
        });

        it('handles undefined tagsList', () => {
            const ideaNoTags = { ...mockIdea, tagsList: undefined };

            render(<IdeaCard {...defaultProps} idea={ideaNoTags} />);

            expect(getFirstByText('Test Idea')).toBeInTheDocument();
        });

        it('adds trailing period to text without punctuation', () => {
            const ideaNoPunctuation = {
                ...mockIdea,
                why_it_matters: 'No punctuation here',
            };

            render(<IdeaCard {...defaultProps} idea={ideaNoPunctuation} />);

            expect(getFirstByText('No punctuation here.')).toBeInTheDocument();
        });

        it('does not add period if text already ends with punctuation', () => {
            const ideaWithPunctuation = {
                ...mockIdea,
                why_it_matters: 'Already has punctuation!',
            };

            render(<IdeaCard {...defaultProps} idea={ideaWithPunctuation} />);

            expect(getFirstByText('Already has punctuation!')).toBeInTheDocument();
        });

        it('handles text ending with question mark', () => {
            const ideaWithQuestion = {
                ...mockIdea,
                why_it_matters: 'Is this important?',
            };

            render(<IdeaCard {...defaultProps} idea={ideaWithQuestion} />);

            expect(getFirstByText('Is this important?')).toBeInTheDocument();
        });

        it('handles text ending with ellipsis', () => {
            const ideaWithEllipsis = {
                ...mockIdea,
                why_it_matters: 'And more...',
            };

            render(<IdeaCard {...defaultProps} idea={ideaWithEllipsis} />);

            expect(getFirstByText('And more...')).toBeInTheDocument();
        });
    });
});

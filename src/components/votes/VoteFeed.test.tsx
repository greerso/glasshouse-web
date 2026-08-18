import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import VoteFeed, { votedCardModel } from './VoteFeed';
import type { VotedSubject } from '@/lib/votes/types';

jest.mock('@/i18n/routing', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

const strings = {
    onTheAgenda: 'On the agenda',
    awaitingMinutes: 'Awaiting minutes',
    olderAwaiting: null,
    noVotes: 'No votes match these filters.',
    showAllOutcomes: 'Show all outcomes',
    unreviewed: 'Unreviewed',
    inferred: 'Inferred',
    passed: 'PASSED',
    failed: 'FAILED',
};

const split: VotedSubject = {
    subjectId: 'tax-amendment',
    subjectName: 'Tax amendment',
    meetingId: 'june-9',
    meetingDateTime: new Date('2026-06-09T23:00:00.000Z'),
    agendaItemIndex: 4,
    bodyId: 'thompsons-station-boma',
    bodyName: 'Board of Mayor and Aldermen',
    result: {
        yayCount: 2,
        nayCount: 3,
        abstainCount: 0,
        outcome: 'FAILED',
        source: 'decision',
        reviewStatus: 'approved',
    },
    votes: [
        {
            personId: 'stover',
            personName: 'Brian Stover',
            electedOrder: 1,
            voteType: 'FOR',
            source: 'decision',
            reviewStatus: 'approved',
        },
        {
            personId: 'king',
            personName: 'Corey King',
            electedOrder: 2,
            voteType: 'AGAINST',
            source: 'decision',
            reviewStatus: 'approved',
        },
        {
            personId: 'white',
            personName: 'Andrew White',
            electedOrder: 3,
            voteType: 'AGAINST',
            source: 'decision',
            reviewStatus: 'approved',
        },
        {
            personId: 'alexander',
            personName: 'Shaun Alexander',
            electedOrder: 4,
            voteType: 'FOR',
            source: 'decision',
            reviewStatus: 'approved',
        },
        {
            personId: 'whitmer',
            personName: 'Bob Whitmer',
            electedOrder: 5,
            voteType: 'AGAINST',
            source: 'decision',
            reviewStatus: 'approved',
        },
    ],
};

const unanimous: VotedSubject = {
    subjectId: 'consent',
    subjectName: 'Consent Agenda',
    meetingId: 'june-9',
    meetingDateTime: new Date('2026-06-09T23:00:00.000Z'),
    agendaItemIndex: 1,
    bodyId: 'thompsons-station-boma',
    bodyName: 'Board of Mayor and Aldermen',
    result: {
        yayCount: 5,
        nayCount: 0,
        abstainCount: 0,
        outcome: 'PASSED',
        source: 'decision',
        reviewStatus: 'approved',
    },
    votes: split.votes.map((vote) => ({ ...vote, voteType: 'FOR' as const })),
};

const upcoming = [
    {
        subjectId: 'ord-020',
        subjectName: 'Consideration of Ordinance 2026-020',
        meetingId: 'sept-8',
        meetingDateTime: new Date('2026-09-08T23:00:00.000Z'),
        bodyName: 'Board of Mayor and Aldermen',
    },
];

const awaiting = [
    {
        subjectId: 'ord-014',
        subjectName: 'Consideration of Ordinance 2026-014',
        meetingId: 'may-12',
        meetingDateTime: new Date('2026-05-12T23:00:00.000Z'),
        bodyName: 'Board of Mayor and Aldermen',
    },
];

function renderFeed(voted: VotedSubject[] = [split]) {
    return render(
        <VoteFeed
            cityId="thompsons-station"
            timezone="America/Chicago"
            locale="en"
            upcoming={upcoming}
            awaiting={awaiting}
            voted={voted}
            votedTotal={voted.length}
            viewAllHref="/thompsons-station/votes?view=all"
            strings={strings}
        />,
    );
}

describe('VoteFeed', () => {
    it('renders upcoming, awaiting, and a split tally without a unanimous card', () => {
        // Parent only passes split items (default view=splits). The 5–0 exists
        // in the window but must not appear when it is not in `voted`.
        void unanimous;
        renderFeed([split]);

        expect(screen.getByText('On the agenda')).toBeInTheDocument();
        expect(screen.getByText('Awaiting minutes')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ordinance 2026-020' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ordinance 2026-014' })).toBeInTheDocument();
        expect(screen.getByText('2–3')).toBeInTheDocument();
        expect(screen.getByText('Stover yes')).toBeInTheDocument();
        expect(screen.getByText('King no')).toBeInTheDocument();
        expect(screen.queryByText(/upcoming vote/i)).toBeNull();
        expect(screen.queryByText('Consent Agenda')).toBeNull();
        expect(screen.getByRole('link', { name: 'Tax amendment' })).toHaveAttribute(
            'href',
            '/thompsons-station/june-9/subjects/tax-amendment',
        );
        const tally = screen.getByText('2–3');
        const agenda = screen.getByText('On the agenda');
        expect(tally.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('strips agenda boilerplate from voted titles', () => {
        expect(votedCardModel(split).title).toBe('Tax amendment');
        expect(
            votedCardModel({
                ...split,
                subjectName: 'Consideration of Ordinance 2026-014:',
            }).title,
        ).toBe('Ordinance 2026-014');
    });

    it('offers view=all when the voted list is empty', () => {
        render(
            <VoteFeed
                cityId="thompsons-station"
                timezone="America/Chicago"
                locale="en"
                upcoming={[]}
                awaiting={[]}
                voted={[]}
                votedTotal={0}
                viewAllHref="/thompsons-station/votes?view=all"
                strings={strings}
            />,
        );

        expect(screen.getByText('No votes match these filters.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Show all outcomes' })).toHaveAttribute(
            'href',
            '/thompsons-station/votes?view=all',
        );
        expect(screen.queryByText('On the agenda')).toBeNull();
        expect(screen.queryByText('Awaiting minutes')).toBeNull();
    });
});

import { paginateVoted } from './paginate';
import type { RawVote, VotedSubject, VoteType } from './types';

function vote(personId: string, voteType: VoteType): RawVote {
    return {
        personId,
        personName: personId.toUpperCase(),
        electedOrder: null,
        voteType,
        source: 'decision',
        reviewStatus: 'approved',
    };
}

function subject(
    overrides: Partial<VotedSubject> & Pick<VotedSubject, 'subjectId' | 'votes'>,
): VotedSubject {
    return {
        subjectName: overrides.subjectId,
        meetingId: 'm1',
        meetingDateTime: new Date('2026-06-09T23:00:00.000Z'),
        agendaItemIndex: 0,
        bodyId: 'council',
        bodyName: 'Board of Mayor and Aldermen',
        result: null,
        ...overrides,
    };
}

const allFor: RawVote[] = ['a', 'b', 'c', 'd', 'e'].map((id) => vote(id, 'FOR'));
const splitVotes: RawVote[] = [
    vote('a', 'FOR'),
    vote('b', 'FOR'),
    vote('c', 'FOR'),
    vote('d', 'AGAINST'),
    vote('e', 'AGAINST'),
];

describe('paginateVoted', () => {
    it('returns both splits from a 30 unanimous + 2 split window', () => {
        const unanimous = Array.from({ length: 30 }, (_, i) =>
            subject({
                subjectId: `u${i}`,
                agendaItemIndex: i,
                votes: allFor,
            }),
        );
        const splits = [
            subject({ subjectId: 's1', agendaItemIndex: 100, votes: splitVotes }),
            subject({ subjectId: 's2', agendaItemIndex: 101, votes: splitVotes }),
        ];

        const result = paginateVoted([...unanimous, ...splits], 'splits', 1, 25);
        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.items.map((s) => s.subjectId)).toEqual(['s1', 's2']);
    });

    it('sorts by meetingDateTime desc then agendaItemIndex asc before slicing', () => {
        const subjects = [
            subject({
                subjectId: 'old-2',
                meetingDateTime: new Date('2026-06-01T18:00:00.000Z'),
                agendaItemIndex: 2,
                votes: allFor,
            }),
            subject({
                subjectId: 'new-0',
                meetingDateTime: new Date('2026-07-01T18:00:00.000Z'),
                agendaItemIndex: 0,
                votes: allFor,
            }),
            subject({
                subjectId: 'old-1',
                meetingDateTime: new Date('2026-06-01T18:00:00.000Z'),
                agendaItemIndex: 1,
                votes: allFor,
            }),
        ];

        const page1 = paginateVoted(subjects, 'named', 1, 2);
        expect(page1.total).toBe(3);
        expect(page1.items.map((s) => s.subjectId)).toEqual(['new-0', 'old-1']);

        const page2 = paginateVoted(subjects, 'named', 2, 2);
        expect(page2.items.map((s) => s.subjectId)).toEqual(['old-2']);
    });
});

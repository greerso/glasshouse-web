import { buildAgreement, type PairCell } from './agreement';
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
    subjectId: string,
    meetingDateTime: Date,
    votes: RawVote[],
): VotedSubject {
    return {
        subjectId,
        subjectName: subjectId,
        meetingId: 'm1',
        meetingDateTime,
        agendaItemIndex: 0,
        bodyId: 'council',
        bodyName: 'Board of Mayor and Aldermen',
        result: null,
        votes,
    };
}

const roster = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({
    personId: id,
    name: id.toUpperCase(),
}));

const allFor = ['a', 'b', 'c', 'd', 'e'].map((id) => vote(id, 'FOR'));
const splitVotes = [
    vote('a', 'FOR'),
    vote('b', 'FOR'),
    vote('c', 'FOR'),
    vote('d', 'AGAINST'),
    vote('e', 'AGAINST'),
];

const item1Date = new Date('2026-06-09T23:00:00.000Z');
const item2Date = new Date('2026-07-14T23:00:00.000Z');

function pair(pairs: PairCell[], x: string, y: string): PairCell | undefined {
    return pairs.find(
        (p) => (p.aId === x && p.bId === y) || (p.aId === y && p.bId === x),
    );
}

describe('buildAgreement', () => {
    const namedSubjects = [
        subject('unanimous', item1Date, allFor),
        subject('split', item2Date, splitVotes),
    ];

    it('counts named, unanimous, and split items and the date range', () => {
        const model = buildAgreement(namedSubjects, roster);
        expect(model.namedItems).toBe(2);
        expect(model.unanimousCount).toBe(1);
        expect(model.splitCount).toBe(1);
        expect(model.dateFrom).toEqual(item1Date);
        expect(model.dateTo).toEqual(item2Date);
        expect(model.splits.map((s) => s.subjectId)).toEqual(['split']);
    });

    it('lists roster coverage including F at 0 of 2 and omits F from pairs', () => {
        const model = buildAgreement(namedSubjects, roster);
        expect(model.people).toEqual([
            { personId: 'a', name: 'A', namedCount: 2 },
            { personId: 'b', name: 'B', namedCount: 2 },
            { personId: 'c', name: 'C', namedCount: 2 },
            { personId: 'd', name: 'D', namedCount: 2 },
            { personId: 'e', name: 'E', namedCount: 2 },
            { personId: 'f', name: 'F', namedCount: 0 },
        ]);
        expect(model.pairs).toHaveLength(10);
        expect(model.pairs.every((p) => p.aId !== 'f' && p.bId !== 'f')).toBe(true);
    });

    it('agrees A–B on both items and A–D on one of two', () => {
        const { pairs } = buildAgreement(namedSubjects, roster);
        expect(pair(pairs, 'a', 'b')).toMatchObject({ agreed: 2, both: 2 });
        expect(pair(pairs, 'a', 'd')).toMatchObject({ agreed: 1, both: 2 });
    });

    it('lists roster people at 0 when there are no named items', () => {
        const model = buildAgreement([], roster);
        expect(model.namedItems).toBe(0);
        expect(model.unanimousCount).toBe(0);
        expect(model.splitCount).toBe(0);
        expect(model.dateFrom).toBeNull();
        expect(model.dateTo).toBeNull();
        expect(model.pairs).toEqual([]);
        expect(model.splits).toEqual([]);
        expect(model.people).toEqual(
            roster.map((r) => ({ ...r, namedCount: 0 })),
        );
    });
});

import { chooseVotes } from './choose';
import type { RawVote } from './types';

const aliceDecisionFor: RawVote = {
    personId: 'alice',
    personName: 'Alice',
    electedOrder: 1,
    voteType: 'FOR',
    source: 'decision',
    reviewStatus: 'approved',
};

const aliceInferredFor: RawVote = {
    personId: 'alice',
    personName: 'Alice',
    electedOrder: 1,
    voteType: 'FOR',
    source: 'inferred',
    reviewStatus: 'unreviewed',
};

const aliceInferredAgainst: RawVote = {
    personId: 'alice',
    personName: 'Alice',
    electedOrder: 1,
    voteType: 'AGAINST',
    source: 'inferred',
    reviewStatus: 'unreviewed',
};

describe('chooseVotes', () => {
    it('collapses decision+inferred FOR to one FOR', () => {
        const chosen = chooseVotes([aliceDecisionFor, aliceInferredFor]);
        expect(chosen).toHaveLength(1);
        expect(chosen[0]).toMatchObject({
            personId: 'alice',
            voteType: 'FOR',
            source: 'decision',
        });
    });

    it('keeps decision FOR when inferred is AGAINST', () => {
        const chosen = chooseVotes([aliceInferredAgainst, aliceDecisionFor]);
        expect(chosen).toHaveLength(1);
        expect(chosen[0]).toMatchObject({
            personId: 'alice',
            voteType: 'FOR',
            source: 'decision',
        });
    });

    it('sorts by electedOrder then personName', () => {
        const votes: RawVote[] = [
            {
                personId: 'c',
                personName: 'Carol',
                electedOrder: 2,
                voteType: 'FOR',
                source: 'decision',
                reviewStatus: 'approved',
            },
            {
                personId: 'b',
                personName: 'Bob',
                electedOrder: null,
                voteType: 'FOR',
                source: 'decision',
                reviewStatus: 'approved',
            },
            {
                personId: 'a',
                personName: 'Ann',
                electedOrder: 1,
                voteType: 'AGAINST',
                source: 'decision',
                reviewStatus: 'approved',
            },
            {
                personId: 'd',
                personName: 'Dan',
                electedOrder: null,
                voteType: 'ABSTAIN',
                source: 'decision',
                reviewStatus: 'approved',
            },
        ];
        expect(chooseVotes(votes).map((v) => v.personId)).toEqual(['a', 'c', 'b', 'd']);
    });
});

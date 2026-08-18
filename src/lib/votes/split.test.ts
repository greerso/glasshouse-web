import { isSplit, matchesView } from './split';
import type { ChosenVote, ResultCounts } from './types';

function named(
    personId: string,
    voteType: ChosenVote['voteType'],
    electedOrder: number | null = null,
): ChosenVote {
    return {
        personId,
        personName: personId,
        electedOrder,
        voteType,
        source: 'decision',
        reviewStatus: 'approved',
    };
}

const result = (
    yayCount: number,
    nayCount: number,
    abstainCount: number,
): ResultCounts => ({
    yayCount,
    nayCount,
    abstainCount,
    outcome: yayCount > nayCount ? 'PASSED' : 'FAILED',
    source: 'decision',
    reviewStatus: 'approved',
});

describe('isSplit', () => {
    it('treats 3–2 named as split', () => {
        const chosen = [
            named('a', 'FOR'),
            named('b', 'FOR'),
            named('c', 'FOR'),
            named('d', 'AGAINST'),
            named('e', 'AGAINST'),
        ];
        expect(isSplit(chosen, null)).toBe(true);
    });

    it('treats 5–0 named as not split', () => {
        const chosen = [
            named('a', 'FOR'),
            named('b', 'FOR'),
            named('c', 'FOR'),
            named('d', 'FOR'),
            named('e', 'FOR'),
        ];
        expect(isSplit(chosen, null)).toBe(false);
    });

    it('treats result 2-3-0 with no names as split', () => {
        expect(isSplit([], result(2, 3, 0))).toBe(true);
    });

    it('treats result 5-0-0 as not split', () => {
        expect(isSplit([], result(5, 0, 0))).toBe(false);
    });

    it('treats 3-1-1 abstain named as split', () => {
        const chosen = [
            named('a', 'FOR'),
            named('b', 'FOR'),
            named('c', 'FOR'),
            named('d', 'AGAINST'),
            named('e', 'ABSTAIN'),
        ];
        expect(isSplit(chosen, null)).toBe(true);
    });

    it('treats FOR + PRESENT only as not split', () => {
        const chosen = [
            named('a', 'FOR'),
            named('b', 'FOR'),
            named('c', 'PRESENT'),
        ];
        expect(isSplit(chosen, null)).toBe(false);
    });
});

describe('matchesView', () => {
    const splitNamed = [named('a', 'FOR'), named('b', 'AGAINST')];
    const unanimousNamed = [named('a', 'FOR'), named('b', 'FOR')];

    it('splits view matches only splits', () => {
        expect(matchesView('splits', splitNamed, null)).toBe(true);
        expect(matchesView('splits', unanimousNamed, null)).toBe(false);
        expect(matchesView('splits', [], result(5, 0, 0))).toBe(false);
        expect(matchesView('splits', [], result(2, 3, 0))).toBe(true);
    });

    it('named view matches any chosen votes', () => {
        expect(matchesView('named', unanimousNamed, null)).toBe(true);
        expect(matchesView('named', [], result(2, 3, 0))).toBe(false);
    });

    it('all view matches chosen votes or a result', () => {
        expect(matchesView('all', unanimousNamed, null)).toBe(true);
        expect(matchesView('all', [], result(5, 0, 0))).toBe(true);
        expect(matchesView('all', [], null)).toBe(false);
    });
});

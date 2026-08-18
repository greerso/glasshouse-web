import type { ChosenVote, FeedView, ResultCounts, VoteType } from './types';

const SPLIT_TYPES = new Set<VoteType>(['FOR', 'AGAINST', 'ABSTAIN']);

export function isSplit(chosen: ChosenVote[], result: ResultCounts | null): boolean {
    const types = new Set(
        chosen.map((v) => v.voteType).filter((t) => SPLIT_TYPES.has(t)),
    );
    if (types.size > 0) {
        return types.size > 1;
    }
    if (result) {
        return result.nayCount > 0 || result.abstainCount > 0;
    }
    return false;
}

export function matchesView(
    view: FeedView,
    chosen: ChosenVote[],
    result: ResultCounts | null,
): boolean {
    switch (view) {
        case 'splits':
            return isSplit(chosen, result);
        case 'named':
            return chosen.length > 0;
        case 'all':
            return chosen.length > 0 || result !== null;
    }
}

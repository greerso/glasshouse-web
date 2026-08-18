import { compareRanks } from '@/lib/sorting/people';
import type { ChosenVote, DataSource, RawVote } from './types';

export const SOURCE_RANK: Record<DataSource, number> = {
    decision: 0,
    manual: 1,
    transcript: 2,
    inferred: 3,
};

export function chooseVotes(votes: RawVote[]): ChosenVote[] {
    const byPerson = new Map<string, RawVote>();

    for (const vote of votes) {
        const existing = byPerson.get(vote.personId);
        if (!existing || SOURCE_RANK[vote.source] < SOURCE_RANK[existing.source]) {
            byPerson.set(vote.personId, vote);
        }
    }

    return [...byPerson.values()].sort((a, b) => {
        const order = compareRanks(a.electedOrder, b.electedOrder);
        if (order !== 0) return order;
        return a.personName.localeCompare(b.personName);
    });
}

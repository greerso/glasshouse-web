import { compareRanks } from '@/lib/sorting/people';
import { chooseVotes } from './choose';
import { matchesView } from './split';
import type { FeedView, VotedSubject } from './types';

export function paginateVoted(
    subjects: VotedSubject[],
    view: FeedView,
    page: number,
    pageSize: number,
): { items: VotedSubject[]; total: number } {
    const sorted = [...subjects].sort((a, b) => {
        const byDate = b.meetingDateTime.getTime() - a.meetingDateTime.getTime();
        if (byDate !== 0) return byDate;
        return compareRanks(a.agendaItemIndex, b.agendaItemIndex);
    });

    const filtered = sorted.filter((subject) =>
        matchesView(view, chooseVotes(subject.votes), subject.result),
    );
    const start = (page - 1) * pageSize;
    return {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length,
    };
}

import { DataSource, ReviewStatus } from '@prisma/client';

export type VoteBadgeRow = {
    source: DataSource;
    reviewStatus: ReviewStatus;
};

export type VoteBadgeState = {
    unreviewed: boolean;
    inferred: boolean;
};

export function voteBadgeState(input: {
    votes?: ReadonlyArray<VoteBadgeRow>;
    voteResult?: VoteBadgeRow | null;
}): VoteBadgeState {
    const rows: VoteBadgeRow[] = [...(input.votes ?? [])];
    if (input.voteResult) {
        rows.push(input.voteResult);
    }
    return {
        unreviewed: rows.some((row) => row.reviewStatus === ReviewStatus.unreviewed),
        inferred: rows.some((row) => row.source === DataSource.inferred),
    };
}

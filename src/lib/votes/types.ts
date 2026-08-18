export type VoteType = 'FOR' | 'AGAINST' | 'ABSTAIN' | 'PRESENT' | 'DID_NOT_VOTE';
export type DataSource = 'decision' | 'transcript' | 'manual' | 'inferred';
export type ReviewStatus = 'unreviewed' | 'approved';
export type VoteOutcome = 'PASSED' | 'FAILED';
export type FeedView = 'splits' | 'named' | 'all';

export type RawVote = {
    personId: string;
    personName: string;
    electedOrder: number | null;
    voteType: VoteType;
    source: DataSource;
    reviewStatus: ReviewStatus;
};

export type ChosenVote = Omit<RawVote, 'source'> & { source: DataSource };

export type ResultCounts = {
    yayCount: number;
    nayCount: number;
    abstainCount: number;
    outcome: VoteOutcome;
    source: DataSource;
    reviewStatus: ReviewStatus;
};

export type VotedSubject = {
    subjectId: string;
    subjectName: string;
    meetingId: string;
    meetingDateTime: Date;
    agendaItemIndex: number | null;
    bodyId: string | null;
    bodyName: string;
    result: ResultCounts | null;
    votes: RawVote[];
};

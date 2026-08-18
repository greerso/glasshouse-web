import { DataSource, ReviewStatus } from '@prisma/client';
import { voteBadgeState } from '../voteBadges';

describe('voteBadgeState', () => {
    it('unreviewed → machine-extracted badge', () => {
        expect(voteBadgeState({
            votes: [{ source: DataSource.decision, reviewStatus: ReviewStatus.unreviewed }],
        })).toEqual({ unreviewed: true, inferred: false });
    });

    it('inferred → inferred badge', () => {
        expect(voteBadgeState({
            votes: [{ source: DataSource.inferred, reviewStatus: ReviewStatus.approved }],
        })).toEqual({ unreviewed: false, inferred: true });
    });

    it('approved+decision → no unreviewed badge', () => {
        expect(voteBadgeState({
            votes: [{ source: DataSource.decision, reviewStatus: ReviewStatus.approved }],
        })).toEqual({ unreviewed: false, inferred: false });
    });

    it('unreviewed inferred shows both badges', () => {
        expect(voteBadgeState({
            votes: [{ source: DataSource.inferred, reviewStatus: ReviewStatus.unreviewed }],
        })).toEqual({ unreviewed: true, inferred: true });
    });

    it('uses voteResult when there are no named votes', () => {
        expect(voteBadgeState({
            votes: [],
            voteResult: { source: DataSource.decision, reviewStatus: ReviewStatus.unreviewed },
        })).toEqual({ unreviewed: true, inferred: false });
    });

    it('approved+decision voteResult → no unreviewed badge', () => {
        expect(voteBadgeState({
            voteResult: { source: DataSource.decision, reviewStatus: ReviewStatus.approved },
        })).toEqual({ unreviewed: false, inferred: false });
    });
});

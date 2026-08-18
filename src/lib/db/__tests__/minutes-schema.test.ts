import { DataSource, ReviewStatus, VoteKind, VoteOutcome } from '@prisma/client';

describe('minutes vote schema', () => {
    it('adds inferred to DataSource', () => {
        expect(DataSource.inferred).toBe('inferred');
        expect(DataSource.decision).toBe('decision');
    });

    it('adds ReviewStatus, VoteOutcome, VoteKind', () => {
        expect(ReviewStatus.unreviewed).toBe('unreviewed');
        expect(ReviewStatus.approved).toBe('approved');
        expect(VoteOutcome.PASSED).toBe('PASSED');
        expect(VoteOutcome.FAILED).toBe('FAILED');
        expect(VoteKind.ROLL_CALL).toBe('ROLL_CALL');
        expect(VoteKind.VOICE).toBe('VOICE');
    });
});

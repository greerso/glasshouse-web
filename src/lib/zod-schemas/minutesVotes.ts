import { z } from 'zod';

const minutesSourceSchema = z.enum(['decision', 'inferred']);

const minutesVoteSchema = z.object({
    personId: z.string().min(1),
    voteType: z.enum(['FOR', 'AGAINST', 'ABSTAIN', 'PRESENT', 'DID_NOT_VOTE']),
});

const minutesResultSchema = z.object({
    subjectId: z.string().min(1),
    outcome: z.enum(['PASSED', 'FAILED']),
    yayCount: z.number().int().nonnegative(),
    nayCount: z.number().int().nonnegative(),
    abstainCount: z.number().int().nonnegative().optional().default(0),
    kind: z.enum(['ROLL_CALL', 'VOICE']),
    motionText: z.string().optional(),
    source: minutesSourceSchema,
    votes: z.array(minutesVoteSchema),
});

const minutesAttendanceSchema = z.object({
    personId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT']),
    source: minutesSourceSchema.optional().default('decision'),
});

export const minutesVotesBodySchema = z.object({
    attendance: z.array(minutesAttendanceSchema).optional().default([]),
    results: z.array(minutesResultSchema).optional().default([]),
});

export const minutesVotesReviewSchema = z.object({
    reviewStatus: z.literal('approved'),
});

export type MinutesVotesBody = z.infer<typeof minutesVotesBodySchema>;
export type MinutesVotesReview = z.infer<typeof minutesVotesReviewSchema>;

import { minutesVotesBodySchema, minutesVotesReviewSchema } from '../minutesVotes';

const STOVER = 'thompsons-station-brian-stover';
const ALEXANDER = 'thompsons-station-shaun-alexander';
const KING = 'thompsons-station-harry-king';
const WHITE = 'thompsons-station-kreis-white';
const WHITMER = 'thompsons-station-bob-whitmer';

const namedRollCall = {
    attendance: [
        { personId: STOVER, status: 'PRESENT', source: 'decision' },
        { personId: ALEXANDER, status: 'PRESENT', source: 'decision' },
        { personId: KING, status: 'PRESENT', source: 'decision' },
        { personId: WHITE, status: 'PRESENT', source: 'decision' },
        { personId: WHITMER, status: 'PRESENT', source: 'decision' },
    ],
    results: [{
        subjectId: 'consent-parent',
        outcome: 'PASSED',
        yayCount: 5,
        nayCount: 0,
        abstainCount: 0,
        kind: 'ROLL_CALL',
        motionText: 'Approve the Consent Agenda',
        source: 'decision',
        votes: [
            { personId: ALEXANDER, voteType: 'FOR' },
            { personId: KING, voteType: 'FOR' },
            { personId: STOVER, voteType: 'FOR' },
            { personId: WHITE, voteType: 'FOR' },
            { personId: WHITMER, voteType: 'FOR' },
        ],
    }],
};

describe('minutesVotesBodySchema', () => {
    it('accepts a named roll-call with attendance and per-member votes', () => {
        const parsed = minutesVotesBodySchema.parse(namedRollCall);
        expect(parsed.attendance).toHaveLength(5);
        expect(parsed.results).toHaveLength(1);
        expect(parsed.results[0].votes).toHaveLength(5);
        expect(parsed.results[0].source).toBe('decision');
        expect(parsed.results[0].kind).toBe('ROLL_CALL');
        expect(parsed.results[0].votes.map((v) => v.voteType)).toEqual([
            'FOR', 'FOR', 'FOR', 'FOR', 'FOR',
        ]);
    });

    it('accepts an empty votes array (result only)', () => {
        const parsed = minutesVotesBodySchema.parse({
            results: [{
                subjectId: 'voice-only',
                outcome: 'PASSED',
                yayCount: 4,
                nayCount: 1,
                abstainCount: 0,
                kind: 'VOICE',
                source: 'decision',
                votes: [],
            }],
        });
        expect(parsed.results[0].votes).toEqual([]);
        expect(parsed.results[0].kind).toBe('VOICE');
        expect(parsed.attendance).toEqual([]);
    });

    it('accepts inferred as a source', () => {
        const parsed = minutesVotesBodySchema.parse({
            results: [{
                subjectId: 'unanimous-voice',
                outcome: 'PASSED',
                yayCount: 5,
                nayCount: 0,
                abstainCount: 0,
                kind: 'VOICE',
                source: 'inferred',
                votes: [{ personId: STOVER, voteType: 'FOR' }],
            }],
        });
        expect(parsed.results[0].source).toBe('inferred');
    });

    it('rejects source minutes', () => {
        expect(() => minutesVotesBodySchema.parse({
            results: [{
                subjectId: 'consent-parent',
                outcome: 'PASSED',
                yayCount: 5,
                nayCount: 0,
                kind: 'ROLL_CALL',
                source: 'minutes',
                votes: [],
            }],
        })).toThrow();
    });

    it('rejects attendance source minutes', () => {
        expect(() => minutesVotesBodySchema.parse({
            attendance: [{ personId: STOVER, status: 'PRESENT', source: 'minutes' }],
            results: [{
                subjectId: 'consent-parent',
                outcome: 'PASSED',
                yayCount: 5,
                nayCount: 0,
                kind: 'ROLL_CALL',
                source: 'decision',
                votes: [],
            }],
        })).toThrow();
    });
});

describe('minutesVotesReviewSchema', () => {
    it('accepts reviewStatus approved', () => {
        expect(minutesVotesReviewSchema.parse({ reviewStatus: 'approved' })).toEqual({
            reviewStatus: 'approved',
        });
    });

    it('rejects reviewStatus unreviewed', () => {
        expect(() => minutesVotesReviewSchema.parse({ reviewStatus: 'unreviewed' })).toThrow();
    });
});

const mockSubjectFindMany = jest.fn();
const mockVoteFindUnique = jest.fn();
const mockVoteCreate = jest.fn();
const mockVoteUpdate = jest.fn();
const mockVoteUpdateMany = jest.fn();
const mockResultFindUnique = jest.fn();
const mockResultCreate = jest.fn();
const mockResultUpdate = jest.fn();
const mockResultUpdateMany = jest.fn();
const mockAttendanceFindUnique = jest.fn();
const mockAttendanceCreate = jest.fn();
const mockAttendanceUpdate = jest.fn();
const mockAttendanceUpdateMany = jest.fn();

jest.mock('../prisma', () => ({
    __esModule: true,
    default: {
        subject: {
            findMany: (...args: unknown[]) => mockSubjectFindMany(...args),
        },
        subjectVote: {
            findUnique: (...args: unknown[]) => mockVoteFindUnique(...args),
            create: (...args: unknown[]) => mockVoteCreate(...args),
            update: (...args: unknown[]) => mockVoteUpdate(...args),
            updateMany: (...args: unknown[]) => mockVoteUpdateMany(...args),
        },
        subjectVoteResult: {
            findUnique: (...args: unknown[]) => mockResultFindUnique(...args),
            create: (...args: unknown[]) => mockResultCreate(...args),
            update: (...args: unknown[]) => mockResultUpdate(...args),
            updateMany: (...args: unknown[]) => mockResultUpdateMany(...args),
        },
        meetingAttendance: {
            findUnique: (...args: unknown[]) => mockAttendanceFindUnique(...args),
            create: (...args: unknown[]) => mockAttendanceCreate(...args),
            update: (...args: unknown[]) => mockAttendanceUpdate(...args),
            updateMany: (...args: unknown[]) => mockAttendanceUpdateMany(...args),
        },
    },
}));

import { approveMeetingVotes, upsertMinutesVotes } from '../minutes-votes';

const STOVER = 'thompsons-station-brian-stover';
const ALEXANDER = 'thompsons-station-shaun-alexander';
const KING = 'thompsons-station-harry-king';
const WHITE = 'thompsons-station-kreis-white';
const WHITMER = 'thompsons-station-bob-whitmer';

const namedResult = {
    subjectId: 'consent-parent',
    outcome: 'PASSED' as const,
    yayCount: 5,
    nayCount: 0,
    abstainCount: 0,
    kind: 'ROLL_CALL' as const,
    motionText: 'Approve the Consent Agenda',
    source: 'decision' as const,
    votes: [
        { personId: ALEXANDER, voteType: 'FOR' as const },
        { personId: KING, voteType: 'FOR' as const },
        { personId: STOVER, voteType: 'FOR' as const },
        { personId: WHITE, voteType: 'FOR' as const },
        { personId: WHITMER, voteType: 'FOR' as const },
    ],
};

function mockCreates() {
    mockSubjectFindMany.mockResolvedValue([{ id: 'consent-parent' }]);
    mockAttendanceFindUnique.mockResolvedValue(null);
    mockResultFindUnique.mockResolvedValue(null);
    mockVoteFindUnique.mockResolvedValue(null);
    mockAttendanceCreate.mockImplementation(async ({ data }) => ({ id: 'att', reviewStatus: 'unreviewed', ...data }));
    mockResultCreate.mockImplementation(async ({ data }) => ({ id: 'res', reviewStatus: 'unreviewed', ...data }));
    mockVoteCreate.mockImplementation(async ({ data }) => ({ id: 'vote', reviewStatus: 'unreviewed', ...data }));
}

describe('upsertMinutesVotes', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates attendance, result, and named roll-call votes', async () => {
        mockCreates();

        await upsertMinutesVotes('thompsons-station', 'champds-377', {
            attendance: [
                { personId: STOVER, status: 'PRESENT', source: 'decision' },
                { personId: ALEXANDER, status: 'PRESENT', source: 'decision' },
                { personId: KING, status: 'PRESENT', source: 'decision' },
                { personId: WHITE, status: 'PRESENT', source: 'decision' },
                { personId: WHITMER, status: 'PRESENT', source: 'decision' },
            ],
            results: [namedResult],
        });

        expect(mockAttendanceCreate).toHaveBeenCalledTimes(5);
        expect(mockAttendanceCreate).toHaveBeenCalledWith({
            data: {
                cityId: 'thompsons-station',
                councilMeetingId: 'champds-377',
                personId: STOVER,
                status: 'PRESENT',
                source: 'decision',
            },
        });
        expect(mockResultCreate).toHaveBeenCalledWith({
            data: {
                subjectId: 'consent-parent',
                outcome: 'PASSED',
                yayCount: 5,
                nayCount: 0,
                abstainCount: 0,
                kind: 'ROLL_CALL',
                motionText: 'Approve the Consent Agenda',
                source: 'decision',
            },
        });
        expect(mockVoteCreate).toHaveBeenCalledTimes(5);
        expect(mockVoteCreate).toHaveBeenCalledWith({
            data: {
                subjectId: 'consent-parent',
                personId: STOVER,
                voteType: 'FOR',
                source: 'decision',
            },
        });
        expect(mockVoteFindUnique).toHaveBeenCalledWith({
            where: {
                subjectId_personId_source: {
                    subjectId: 'consent-parent',
                    personId: STOVER,
                    source: 'decision',
                },
            },
        });
    });

    it('writes a result with an empty votes array and no SubjectVote rows', async () => {
        mockCreates();

        await upsertMinutesVotes('thompsons-station', 'champds-377', {
            attendance: [],
            results: [{
                subjectId: 'consent-parent',
                outcome: 'PASSED',
                yayCount: 4,
                nayCount: 1,
                abstainCount: 0,
                kind: 'VOICE',
                source: 'decision',
                votes: [],
            }],
        });

        expect(mockResultCreate).toHaveBeenCalledTimes(1);
        expect(mockVoteCreate).not.toHaveBeenCalled();
        expect(mockVoteUpdate).not.toHaveBeenCalled();
    });

    it('preserves reviewStatus when voteType is unchanged', async () => {
        mockSubjectFindMany.mockResolvedValue([{ id: 'consent-parent' }]);
        mockResultFindUnique.mockResolvedValue({
            id: 'res-1',
            yayCount: 5,
            nayCount: 0,
            abstainCount: 0,
            reviewStatus: 'approved',
        });
        mockResultUpdate.mockResolvedValue({});
        mockVoteFindUnique.mockResolvedValue({
            id: 'vote-1',
            voteType: 'FOR',
            reviewStatus: 'approved',
        });
        mockVoteUpdate.mockResolvedValue({});

        await upsertMinutesVotes('thompsons-station', 'champds-377', {
            attendance: [],
            results: [{
                ...namedResult,
                votes: [{ personId: STOVER, voteType: 'FOR' }],
            }],
        });

        expect(mockVoteCreate).not.toHaveBeenCalled();
        expect(mockVoteUpdate).toHaveBeenCalledWith({
            where: { id: 'vote-1' },
            data: { voteType: 'FOR', reviewStatus: 'approved' },
        });
        expect(mockResultUpdate).toHaveBeenCalledWith({
            where: { id: 'res-1' },
            data: expect.objectContaining({
                yayCount: 5,
                nayCount: 0,
                abstainCount: 0,
                reviewStatus: 'approved',
            }),
        });
    });

    it('resets reviewStatus when voteType or counts change', async () => {
        mockSubjectFindMany.mockResolvedValue([{ id: 'consent-parent' }]);
        mockResultFindUnique.mockResolvedValue({
            id: 'res-1',
            yayCount: 5,
            nayCount: 0,
            abstainCount: 0,
            reviewStatus: 'approved',
        });
        mockResultUpdate.mockResolvedValue({});
        mockVoteFindUnique.mockResolvedValue({
            id: 'vote-1',
            voteType: 'FOR',
            reviewStatus: 'approved',
        });
        mockVoteUpdate.mockResolvedValue({});

        await upsertMinutesVotes('thompsons-station', 'champds-377', {
            attendance: [],
            results: [{
                subjectId: 'consent-parent',
                outcome: 'FAILED',
                yayCount: 2,
                nayCount: 3,
                abstainCount: 0,
                kind: 'ROLL_CALL',
                source: 'decision',
                votes: [{ personId: STOVER, voteType: 'AGAINST' }],
            }],
        });

        expect(mockVoteUpdate).toHaveBeenCalledWith({
            where: { id: 'vote-1' },
            data: { voteType: 'AGAINST', reviewStatus: 'unreviewed' },
        });
        expect(mockResultUpdate).toHaveBeenCalledWith({
            where: { id: 'res-1' },
            data: expect.objectContaining({
                yayCount: 2,
                nayCount: 3,
                reviewStatus: 'unreviewed',
            }),
        });
    });

    it('preserves attendance reviewStatus when status is unchanged and resets when it changes', async () => {
        mockSubjectFindMany.mockResolvedValue([]);
        mockAttendanceFindUnique
            .mockResolvedValueOnce({ id: 'att-1', status: 'PRESENT', reviewStatus: 'approved' })
            .mockResolvedValueOnce({ id: 'att-2', status: 'PRESENT', reviewStatus: 'approved' });
        mockAttendanceUpdate.mockResolvedValue({});

        await upsertMinutesVotes('thompsons-station', 'champds-377', {
            attendance: [
                { personId: STOVER, status: 'PRESENT', source: 'decision' },
                { personId: KING, status: 'ABSENT', source: 'decision' },
            ],
            results: [],
        });

        expect(mockAttendanceUpdate).toHaveBeenNthCalledWith(1, {
            where: { id: 'att-1' },
            data: { status: 'PRESENT', reviewStatus: 'approved' },
        });
        expect(mockAttendanceUpdate).toHaveBeenNthCalledWith(2, {
            where: { id: 'att-2' },
            data: { status: 'ABSENT', reviewStatus: 'unreviewed' },
        });
    });
});

describe('approveMeetingVotes', () => {
    beforeEach(() => jest.clearAllMocks());

    it('sets reviewStatus approved on votes, attendance, and results for the meeting', async () => {
        mockVoteUpdateMany.mockResolvedValue({ count: 5 });
        mockAttendanceUpdateMany.mockResolvedValue({ count: 5 });
        mockResultUpdateMany.mockResolvedValue({ count: 1 });

        await approveMeetingVotes('thompsons-station', 'champds-377');

        expect(mockVoteUpdateMany).toHaveBeenCalledWith({
            where: { subject: { cityId: 'thompsons-station', councilMeetingId: 'champds-377' } },
            data: { reviewStatus: 'approved' },
        });
        expect(mockAttendanceUpdateMany).toHaveBeenCalledWith({
            where: { cityId: 'thompsons-station', councilMeetingId: 'champds-377' },
            data: { reviewStatus: 'approved' },
        });
        expect(mockResultUpdateMany).toHaveBeenCalledWith({
            where: { subject: { cityId: 'thompsons-station', councilMeetingId: 'champds-377' } },
            data: { reviewStatus: 'approved' },
        });
    });
});

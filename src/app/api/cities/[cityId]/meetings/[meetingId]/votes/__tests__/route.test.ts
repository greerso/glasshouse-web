/** @jest-environment node */
import { readFileSync } from 'fs';
import { join } from 'path';

jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }));
jest.mock('@/lib/auth', () => ({
    withServiceOrUserAuth: jest.fn(),
    getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/db/minutes-votes', () => ({
    upsertMinutesVotes: jest.fn(),
    approveMeetingVotes: jest.fn(),
}));

import { PATCH, POST } from '../route';
import { getCurrentUser, withServiceOrUserAuth } from '@/lib/auth';
import { approveMeetingVotes, upsertMinutesVotes } from '@/lib/db/minutes-votes';

const mockAuth = withServiceOrUserAuth as jest.MockedFunction<typeof withServiceOrUserAuth>;
const mockGetUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockUpsert = upsertMinutesVotes as jest.MockedFunction<typeof upsertMinutesVotes>;
const mockApprove = approveMeetingVotes as jest.MockedFunction<typeof approveMeetingVotes>;

const params = { params: Promise.resolve({ cityId: 'thompsons-station', meetingId: 'champds-377' }) };

const namedRollCall = {
    attendance: [
        { personId: 'thompsons-station-brian-stover', status: 'PRESENT', source: 'decision' },
    ],
    results: [{
        subjectId: 'consent-parent',
        outcome: 'PASSED',
        yayCount: 5,
        nayCount: 0,
        abstainCount: 0,
        kind: 'ROLL_CALL',
        source: 'decision',
        votes: [{ personId: 'thompsons-station-brian-stover', voteType: 'FOR' }],
    }],
};

function makePost(body: unknown) {
    return new Request('http://localhost/api/cities/thompsons-station/meetings/champds-377/votes', {
        method: 'POST',
        headers: { authorization: 'Bearer sk_test', 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

function makePatch(body: unknown) {
    return new Request('http://localhost/api/cities/thompsons-station/meetings/champds-377/votes', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /meetings/:id/votes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.mockResolvedValue({ type: 'service', keyName: 'ingest' });
        mockUpsert.mockResolvedValue({ attendance: [], results: [], votes: [] } as any);
    });

    it('upserts named roll-call votes with service auth', async () => {
        const res = await POST(makePost(namedRollCall) as any, params);
        expect(res.status).toBe(200);
        expect(mockAuth).toHaveBeenCalled();
        expect(mockUpsert).toHaveBeenCalledWith(
            'thompsons-station',
            'champds-377',
            expect.objectContaining({
                results: [expect.objectContaining({
                    subjectId: 'consent-parent',
                    source: 'decision',
                    votes: [expect.objectContaining({ personId: 'thompsons-station-brian-stover', voteType: 'FOR' })],
                })],
            }),
        );
    });

    it('accepts an empty votes array (result only)', async () => {
        const res = await POST(makePost({
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
        }) as any, params);
        expect(res.status).toBe(200);
        expect(mockUpsert).toHaveBeenCalledWith(
            'thompsons-station',
            'champds-377',
            expect.objectContaining({
                results: [expect.objectContaining({ votes: [] })],
            }),
        );
    });

    it('rejects source minutes', async () => {
        const res = await POST(makePost({
            results: [{
                subjectId: 'consent-parent',
                outcome: 'PASSED',
                yayCount: 5,
                nayCount: 0,
                kind: 'ROLL_CALL',
                source: 'minutes',
                votes: [],
            }],
        }) as any, params);
        expect(res.status).toBe(400);
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('returns 401 when auth throws', async () => {
        const { UnauthorizedError } = await import('@/lib/api/errors');
        mockAuth.mockRejectedValue(new UnauthorizedError('Invalid API key'));
        const res = await POST(makePost(namedRollCall) as any, params);
        expect(res.status).toBe(401);
        expect(mockUpsert).not.toHaveBeenCalled();
    });
});

describe('PATCH /meetings/:id/votes', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 403 for a service key (no superadmin session)', async () => {
        mockGetUser.mockResolvedValue(null as any);
        const res = await PATCH(makePatch({ reviewStatus: 'approved' }) as any, params);
        expect(res.status).toBe(403);
        expect(mockApprove).not.toHaveBeenCalled();
    });

    it('returns 200 for a superadmin session', async () => {
        mockGetUser.mockResolvedValue({ id: 'admin', isSuperAdmin: true } as any);
        mockApprove.mockResolvedValue({ votes: 5, attendance: 5, results: 1 } as any);
        const res = await PATCH(makePatch({ reviewStatus: 'approved' }) as any, params);
        expect(res.status).toBe(200);
        expect(mockApprove).toHaveBeenCalledWith('thompsons-station', 'champds-377');
    });

    it('rejects reviewStatus other than approved', async () => {
        mockGetUser.mockResolvedValue({ id: 'admin', isSuperAdmin: true } as any);
        const res = await PATCH(makePatch({ reviewStatus: 'unreviewed' }) as any, params);
        expect(res.status).toBe(400);
        expect(mockApprove).not.toHaveBeenCalled();
    });
});

describe('votes route isolation', () => {
    it('does not import pollDecisions.ts', () => {
        const src = readFileSync(join(__dirname, '../route.ts'), 'utf8');
        expect(src).not.toMatch(/pollDecisions/);
    });
});

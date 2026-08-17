/** @jest-environment node */
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }));
jest.mock('@/lib/auth', () => ({
    withServiceOrUserAuth: jest.fn(),
}));
jest.mock('@/lib/db/subjects-ingest', () => ({
    upsertIngestSubjects: jest.fn(),
}));

import { POST } from '../route';
import { withServiceOrUserAuth } from '@/lib/auth';
import { upsertIngestSubjects } from '@/lib/db/subjects-ingest';

const mockAuth = withServiceOrUserAuth as jest.MockedFunction<typeof withServiceOrUserAuth>;
const mockUpsert = upsertIngestSubjects as jest.MockedFunction<typeof upsertIngestSubjects>;

function makePost(body: unknown) {
    return new Request('http://localhost/api/cities/thompsons-station/meetings/aug11_2026/subjects', {
        method: 'POST',
        headers: { authorization: 'Bearer sk_test', 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /meetings/:id/subjects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.mockResolvedValue({ type: 'service', keyName: 'ingest' });
    });

    it('upserts subjects and returns 200', async () => {
        mockUpsert.mockResolvedValue([{ id: 'sub-1', agendaItemIndex: 0 }] as any);
        const res = await POST(makePost({
            subjects: [{ name: 'Meeting Called to Order:', description: '', agendaItemIndex: 0 }],
        }) as any, { params: Promise.resolve({ cityId: 'thompsons-station', meetingId: 'aug11_2026' }) });
        expect(res.status).toBe(200);
        expect(mockUpsert).toHaveBeenCalledWith(
            'thompsons-station',
            'aug11_2026',
            [expect.objectContaining({ name: 'Meeting Called to Order:', agendaItemIndex: 0 })],
        );
    });

    it('returns 401 when auth throws', async () => {
        const { UnauthorizedError } = await import('@/lib/api/errors');
        mockAuth.mockRejectedValue(new UnauthorizedError('Invalid API key'));
        const res = await POST(makePost({
            subjects: [{ name: 'Adjourn', description: '', agendaItemIndex: 70 }],
        }) as any, { params: Promise.resolve({ cityId: 'thompsons-station', meetingId: 'aug11_2026' }) });
        expect(res.status).toBe(401);
        expect(mockUpsert).not.toHaveBeenCalled();
    });
});

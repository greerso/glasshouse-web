/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ withServiceOrUserAuth: jest.fn() }));
jest.mock('@/lib/db/observations', () => ({
    getObservations: jest.fn(),
    upsertObservation: jest.fn(),
}));

import { GET, POST } from '../route';
import { withServiceOrUserAuth } from '@/lib/auth';
import { getObservations, upsertObservation } from '@/lib/db/observations';

const mockAuth = withServiceOrUserAuth as jest.MockedFunction<typeof withServiceOrUserAuth>;
const mockGet = getObservations as jest.MockedFunction<typeof getObservations>;
const mockUpsert = upsertObservation as jest.MockedFunction<typeof upsertObservation>;

describe('observations API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.mockResolvedValue({ type: 'service', keyName: 'ingest' });
    });

    it('GET filters by source', async () => {
        mockGet.mockResolvedValue([]);
        const req = new Request('http://localhost/api/cities/thompsons-station/observations?source=champds:event:390');
        await GET(req as any, { params: Promise.resolve({ cityId: 'thompsons-station' }) });
        expect(mockGet).toHaveBeenCalledWith('thompsons-station', 'champds:event:390');
    });

    it('POST upserts and returns 200', async () => {
        mockUpsert.mockResolvedValue({
            id: 'obs-1',
            source: 'champds:event:390',
            contentHash: 'abc',
            meetingId: 'aug11_2026',
        } as any);
        const req = new Request('http://localhost/x', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                source: 'champds:event:390',
                contentHash: 'abc',
                meetingId: 'aug11_2026',
            }),
        });
        const res = await POST(req as any, { params: Promise.resolve({ cityId: 'thompsons-station' }) });
        expect(res.status).toBe(200);
        expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
            cityId: 'thompsons-station',
            source: 'champds:event:390',
            meetingId: 'aug11_2026',
        }));
    });
});

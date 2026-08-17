/** @jest-environment node */
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }));
jest.mock('@/lib/auth', () => ({ withServiceOrUserAuth: jest.fn() }));
jest.mock('@/lib/db/meetings', () => ({ toggleMeetingReleaseDirect: jest.fn() }));

import { POST } from '../route';
import { withServiceOrUserAuth } from '@/lib/auth';
import { toggleMeetingReleaseDirect } from '@/lib/db/meetings';

const mockAuth = withServiceOrUserAuth as jest.MockedFunction<typeof withServiceOrUserAuth>;
const mockToggle = toggleMeetingReleaseDirect as jest.MockedFunction<typeof toggleMeetingReleaseDirect>;

describe('POST /meetings/:id/release', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.mockResolvedValue({ type: 'service', keyName: 'ingest' });
        mockToggle.mockResolvedValue({ id: 'aug11_2026', released: true } as any);
    });

    it('sets released=true', async () => {
        const req = new Request('http://localhost/x', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ released: true }),
        });
        const res = await POST(req as any, {
            params: Promise.resolve({ cityId: 'thompsons-station', meetingId: 'champds-387' }),
        });
        expect(res.status).toBe(200);
        expect(mockToggle).toHaveBeenCalledWith('thompsons-station', 'champds-387', true);
    });
});

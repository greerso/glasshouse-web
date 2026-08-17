/** @jest-environment node */
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), revalidatePath: jest.fn() }));
jest.mock('@/lib/auth', () => ({ withServiceOrUserAuth: jest.fn() }));
jest.mock('@/lib/discord', () => ({ sendMeetingCreatedAdminAlert: jest.fn() }));
jest.mock('@/lib/google-calendar', () => ({
    createMeetingCalendarEvent: jest.fn(),
    calculateMeetingEndTime: jest.fn(),
}));
jest.mock('@/lib/tasks/processAgendaInternal', () => ({ requestProcessAgendaInternal: jest.fn() }));
jest.mock('@/env.mjs', () => ({ env: { NEXTAUTH_URL: 'http://localhost:3000' } }));
jest.mock('@/lib/db/prisma', () => ({
    __esModule: true,
    default: { city: { findUnique: jest.fn().mockResolvedValue({ name: 'TS', name_en: 'TS', timezone: 'America/Chicago' }) } },
}));

const mockCreate = jest.fn();
const mockGenerate = jest.fn();
jest.mock('@/lib/db/meetings', () => ({
    createCouncilMeetingDirect: (...args: unknown[]) => mockCreate(...args),
    getCouncilMeetingsForCity: jest.fn(),
    generateUniqueMeetingId: (...args: unknown[]) => mockGenerate(...args),
}));

import { Prisma } from '@prisma/client';
import { POST } from '../route';
import { withServiceOrUserAuth } from '@/lib/auth';

const mockAuth = withServiceOrUserAuth as jest.MockedFunction<typeof withServiceOrUserAuth>;

const body = {
    name: 'Board of Mayor and Aldermen — Regular Meeting',
    name_en: 'Board of Mayor and Aldermen — Regular Meeting',
    date: '2026-08-11T23:00:00.000Z',
    meetingId: 'aug11_2026',
    administrativeBodyId: 'thompsons-station-boma',
    processAgenda: false,
};

describe('POST /meetings ingest extras', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuth.mockResolvedValue({ type: 'service', keyName: 'ingest' });
        mockCreate.mockResolvedValue({ id: 'champds-387', released: false });
    });

    it('returns 409 when a provided meetingId already exists', async () => {
        const err = new Prisma.PrismaClientKnownRequestError('c', { code: 'P2002', clientVersion: '5' });
        mockCreate.mockRejectedValue(err);
        const req = new Request('http://localhost/x', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        });
        const res = await POST(req as any, { params: Promise.resolve({ cityId: 'thompsons-station' }) });
        expect(res.status).toBe(409);
    });

    it('does not honor released:true from a user session', async () => {
        mockAuth.mockResolvedValue({ type: 'user', userId: 'u1' });
        mockCreate.mockResolvedValue({ id: 'x', released: false });
        const req = new Request('http://localhost/x', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...body, meetingId: 'champds-1', released: true }),
        });
        await POST(req as any, { params: Promise.resolve({ cityId: 'thompsons-station' }) });
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ released: false }));
    });

    it('honors released:true from a service key', async () => {
        mockCreate.mockResolvedValue({ id: 'x', released: true });
        const req = new Request('http://localhost/x', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...body, meetingId: 'champds-1', released: true }),
        });
        await POST(req as any, { params: Promise.resolve({ cityId: 'thompsons-station' }) });
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ released: true }));
    });
});

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

jest.mock('../prisma', () => ({
    __esModule: true,
    default: {
        agendaObservation: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
            findUnique: (...args: unknown[]) => mockFindUnique(...args),
            update: (...args: unknown[]) => mockUpdate(...args),
            create: (...args: unknown[]) => mockCreate(...args),
        },
    },
}));

import { getObservations, upsertObservation } from '../observations';

describe('upsertObservation', () => {
    beforeEach(() => jest.clearAllMocks());

    it('inserts and sets firstObservedAt on first sighting', async () => {
        mockFindUnique.mockResolvedValue(null);
        mockCreate.mockImplementation(async ({ data }) => ({ id: 'obs-1', ...data }));

        const row = await upsertObservation({
            cityId: 'thompsons-station',
            source: 'champds:event:390',
            contentHash: 'hash-1',
            meetingId: 'aug11_2026',
        });

        expect(mockCreate).toHaveBeenCalled();
        expect(row.firstObservedAt).toBeInstanceOf(Date);
        expect(row.contentHash).toBe('hash-1');
    });

    it('updates contentHash and keeps firstObservedAt on a later sighting', async () => {
        const first = new Date('2026-08-11T00:00:00.000Z');
        mockFindUnique.mockResolvedValue({
            id: 'obs-1',
            firstObservedAt: first,
            contentHash: 'hash-1',
        });
        mockUpdate.mockResolvedValue({
            id: 'obs-1',
            firstObservedAt: first,
            contentHash: 'hash-2',
        });

        const row = await upsertObservation({
            cityId: 'thompsons-station',
            source: 'champds:event:390',
            contentHash: 'hash-2',
            meetingId: 'aug11_2026',
        });

        expect(mockCreate).not.toHaveBeenCalled();
        expect(row.firstObservedAt).toEqual(first);
        expect(row.contentHash).toBe('hash-2');
    });
});

describe('getObservations', () => {
    it('filters by exact source when provided', async () => {
        mockFindMany.mockResolvedValue([]);
        await getObservations('thompsons-station', 'champds:event:390');
        expect(mockFindMany).toHaveBeenCalledWith({
            where: { cityId: 'thompsons-station', source: 'champds:event:390' },
            orderBy: { firstObservedAt: 'asc' },
        });
    });
});

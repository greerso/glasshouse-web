const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

jest.mock('../prisma', () => ({
    __esModule: true,
    default: {
        subject: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
            update: (...args: unknown[]) => mockUpdate(...args),
            create: (...args: unknown[]) => mockCreate(...args),
        },
    },
}));

import { upsertIngestSubjects } from '../subjects-ingest';

describe('upsertIngestSubjects', () => {
    beforeEach(() => jest.clearAllMocks());

    it('updates the existing row when agendaItemIndex matches', async () => {
        mockFindMany.mockResolvedValue([{ id: 'sub-1', agendaItemIndex: 0 }]);
        mockUpdate.mockResolvedValue({ id: 'sub-1', name: 'Meeting Called to Order:', agendaItemIndex: 0 });

        const result = await upsertIngestSubjects('thompsons-station', 'aug11_2026', [
            { name: 'Meeting Called to Order:', description: '', agendaItemIndex: 0 },
        ]);

        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'sub-1' },
            data: {
                name: 'Meeting Called to Order:',
                description: '',
                contextCitationUrls: [],
            },
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('sub-1');
    });

    it('creates when no subject has that agendaItemIndex', async () => {
        mockFindMany.mockResolvedValue([]);
        mockCreate.mockResolvedValue({ id: 'new-1', agendaItemIndex: 70 });

        await upsertIngestSubjects('thompsons-station', 'aug11_2026', [
            { name: 'Adjourn', description: '', agendaItemIndex: 70 },
        ]);

        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalledWith({
            data: {
                name: 'Adjourn',
                description: '',
                agendaItemIndex: 70,
                cityId: 'thompsons-station',
                councilMeetingId: 'aug11_2026',
                contextCitationUrls: [],
            },
        });
    });

    it('updates the existing out-of-agenda row when name and nonAgendaReason match', async () => {
        mockFindMany.mockResolvedValue([{
            id: 'amd-1',
            name: 'Amendment: Ordinance 2026-014',
            nonAgendaReason: 'outOfAgenda',
            agendaItemIndex: null,
        }]);
        mockUpdate.mockResolvedValue({ id: 'amd-1', name: 'Amendment: Ordinance 2026-014' });

        await upsertIngestSubjects('thompsons-station', 'champds-377', [
            { name: 'Amendment: Ordinance 2026-014', description: '', nonAgendaReason: 'outOfAgenda' },
        ]);

        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'amd-1' },
            data: {
                name: 'Amendment: Ordinance 2026-014',
                description: '',
                contextCitationUrls: [],
            },
        });
    });

    it('creates an out-of-agenda subject when name and nonAgendaReason are new', async () => {
        mockFindMany.mockResolvedValue([]);
        mockCreate.mockResolvedValue({ id: 'amd-new', nonAgendaReason: 'outOfAgenda' });

        await upsertIngestSubjects('thompsons-station', 'champds-377', [
            { name: 'Amendment: Ordinance 2026-014', description: '', nonAgendaReason: 'outOfAgenda' },
        ]);

        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalledWith({
            data: {
                name: 'Amendment: Ordinance 2026-014',
                description: '',
                agendaItemIndex: null,
                nonAgendaReason: 'outOfAgenda',
                cityId: 'thompsons-station',
                councilMeetingId: 'champds-377',
                contextCitationUrls: [],
            },
        });
    });
});

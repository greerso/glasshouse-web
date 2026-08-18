import { ingestSubjectsBodySchema } from '../ingestSubject';

describe('ingestSubjectsBodySchema', () => {
    it('accepts a subject with a numeric agendaItemIndex', () => {
        const parsed = ingestSubjectsBodySchema.parse({
            subjects: [{ name: 'Adjourn', description: '', agendaItemIndex: 70 }],
        });
        expect(parsed.subjects[0].agendaItemIndex).toBe(70);
        expect(parsed.subjects[0].contextCitationUrls).toEqual([]);
    });

    it('rejects a missing name', () => {
        expect(() => ingestSubjectsBodySchema.parse({
            subjects: [{ description: '', agendaItemIndex: 0 }],
        })).toThrow();
    });

    it('accepts an out-of-agenda subject with nonAgendaReason', () => {
        const parsed = ingestSubjectsBodySchema.parse({
            subjects: [{
                name: 'Amendment: Ordinance 2026-014',
                description: '',
                nonAgendaReason: 'outOfAgenda',
            }],
        });
        expect(parsed.subjects[0]).toEqual(expect.objectContaining({
            name: 'Amendment: Ordinance 2026-014',
            nonAgendaReason: 'outOfAgenda',
        }));
        expect('agendaItemIndex' in parsed.subjects[0]).toBe(false);
    });

    it('rejects a subject with neither agendaItemIndex nor nonAgendaReason', () => {
        expect(() => ingestSubjectsBodySchema.parse({
            subjects: [{ name: 'Adjourn', description: '' }],
        })).toThrow();
    });
});

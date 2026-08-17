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
});

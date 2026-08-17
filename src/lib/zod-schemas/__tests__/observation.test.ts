import { observationBodySchema } from '../observation';

describe('observationBodySchema', () => {
    it('requires source and contentHash', () => {
        const parsed = observationBodySchema.parse({
            source: 'champds:event:390',
            contentHash: 'abc',
            meetingId: 'aug11_2026',
        });
        expect(parsed.source).toBe('champds:event:390');
        expect(parsed.meetingId).toBe('aug11_2026');
    });

    it('rejects an empty source', () => {
        expect(() => observationBodySchema.parse({ source: '', contentHash: 'abc' })).toThrow();
    });
});

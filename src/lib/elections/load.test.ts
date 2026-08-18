import { loadElection } from './load';

describe('loadElection', () => {
    it('returns the TS file for thompsons-station', () => {
        const file = loadElection('thompsons-station');
        expect(file?.cityId).toBe('thompsons-station');
        expect(file?.candidates).toEqual([]);
        expect(file?.offices.map((o) => o.id)).toEqual(['mayor', 'alderman']);
    });

    it('returns null for a known-looking city with no file', () => {
        expect(loadElection('athens')).toBeNull();
    });
});

import { formatCivilDate, formatOffsetInZone } from './civil';

describe('formatCivilDate', () => {
    it('prints Tuesday November 3 2026, not Monday November 2', () => {
        expect(formatCivilDate('2026-11-03', 'en')).toBe('Tuesday, November 3, 2026');
    });

    it('prints Wednesday October 14 2026', () => {
        expect(formatCivilDate('2026-10-14', 'en')).toBe('Wednesday, October 14, 2026');
    });

    it('rejects non YYYY-MM-DD', () => {
        expect(() => formatCivilDate('2026-11-03T00:00:00Z', 'en')).toThrow();
    });
});

describe('formatOffsetInZone', () => {
    it('keeps Aug 20 noon on Aug 20 in Chicago', () => {
        const text = formatOffsetInZone('2026-08-20T12:00:00-05:00', 'America/Chicago', 'en');
        expect(text).toMatch(/August 20, 2026/);
        expect(text).toMatch(/12:00/);
    });
});

import { plainSubjectName, surnameOf } from './display';

describe('plainSubjectName', () => {
    it('strips consideration-of and a trailing colon', () => {
        expect(plainSubjectName('Consideration of Ordinance 2026-014:')).toBe('Ordinance 2026-014');
    });

    it('strips item numbers and stacked 1st-reading prefixes', () => {
        expect(
            plainSubjectName(
                '3. Consideration of 1st Reading of Ordinance 2026-015: An Ordinance of the Town',
            ),
        ).toBe('Ordinance 2026-015');
        expect(
            plainSubjectName(
                '2. Consideration of Resolution 2026-019: A Resolution of the Town of Thompson\'s Station',
            ),
        ).toBe('Resolution 2026-019');
    });

    it('leaves a short title alone', () => {
        expect(plainSubjectName('Tax amendment')).toBe('Tax amendment');
    });
});

describe('surnameOf', () => {
    it('uses the last word', () => {
        expect(surnameOf('Brian Stover')).toBe('Stover');
        expect(surnameOf('Stover')).toBe('Stover');
    });
});

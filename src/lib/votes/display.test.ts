import { plainSubjectName, surnameOf } from './display';

describe('plainSubjectName', () => {
    it('strips consideration-of and a trailing colon', () => {
        expect(plainSubjectName('Consideration of Ordinance 2026-014:')).toBe('Ordinance 2026-014');
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

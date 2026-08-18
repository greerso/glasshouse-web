import { parseElectionFile } from './schema';

const base = {
    cityId: 'thompsons-station',
    electionDate: '2026-11-03',
    title: "Town of Thompson's Station Municipal Election",
    offices: [
        { id: 'mayor', label: 'Mayor', seats: 1 },
        { id: 'alderman', label: 'Alderman', seats: 2 },
    ],
    candidates: [] as unknown[],
    dates: {
        qualifyingClose: '2026-08-20T12:00:00-05:00',
        withdrawalClose: '2026-08-27T12:00:00-05:00',
        registrationDeadline: '2026-10-05T16:30:00-05:00',
        earlyVoteStart: '2026-10-14',
        earlyVoteEnd: '2026-10-29',
        electionDay: '2026-11-03',
    },
    links: [{ label: 'Notice', href: 'https://example.com/notice' }],
    sourceNote: 'Captured 2026-08-17',
    lastCapturedAt: '2026-08-17',
};

describe('parseElectionFile', () => {
    it('accepts seats-only file', () => {
        expect(parseElectionFile(base).candidates).toEqual([]);
    });

    it('accepts a qualified mayor', () => {
        const file = parseElectionFile({
            ...base,
            candidates: [{
                officeId: 'mayor',
                name: 'Exact name as printed',
                sourceUrl: 'https://example.com/list',
                sourceDate: '2026-08-21',
                status: 'qualified',
            }],
        });
        expect(file.candidates[0].officeId).toBe('mayor');
    });

    it('rejects candidate officeId not in offices', () => {
        expect(() => parseElectionFile({
            ...base,
            candidates: [{
                officeId: 'commissioner',
                name: 'X',
                sourceUrl: 'https://example.com/x',
                sourceDate: '2026-08-21',
                status: 'qualified',
            }],
        })).toThrow();
    });

    it('rejects missing title', () => {
        const { title: _t, ...rest } = base;
        expect(() => parseElectionFile(rest)).toThrow();
    });
});

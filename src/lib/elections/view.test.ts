import { parseElectionFile } from './schema';
import { buildElectionView } from './view';

const empty = parseElectionFile({
    cityId: 'thompsons-station',
    electionDate: '2026-11-03',
    title: "Town of Thompson's Station Municipal Election",
    offices: [
        { id: 'mayor', label: 'Mayor', seats: 1 },
        { id: 'alderman', label: 'Alderman', seats: 2 },
    ],
    candidates: [],
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
});

describe('buildElectionView', () => {
    it('hides the name column when candidates is empty', () => {
        const view = buildElectionView(empty, 'America/Chicago', 'en');
        expect(view.showNameColumn).toBe(false);
        expect(view.candidateRows).toEqual([]);
        expect(view.electionDateLabel).toBe('Tuesday, November 3, 2026');
    });

    it('shows one mayor row when qualified', () => {
        const file = parseElectionFile({
            ...empty,
            candidates: [{
                officeId: 'mayor',
                name: 'Exact name as printed',
                sourceUrl: 'https://example.com/list',
                sourceDate: '2026-08-21',
                status: 'qualified',
            }],
        });
        const view = buildElectionView(file, 'America/Chicago', 'en');
        expect(view.showNameColumn).toBe(true);
        expect(view.candidateRows).toEqual([{
            officeLabel: 'Mayor',
            name: 'Exact name as printed',
            status: 'qualified',
            sourceUrl: 'https://example.com/list',
        }]);
    });

    it('does not invent a name for an office with zero candidates', () => {
        const file = parseElectionFile({
            ...empty,
            candidates: [{
                officeId: 'mayor',
                name: 'Exact name as printed',
                sourceUrl: 'https://example.com/list',
                sourceDate: '2026-08-21',
                status: 'qualified',
            }],
        });
        const view = buildElectionView(file, 'America/Chicago', 'en');
        expect(view.candidateRows.some((r) => r.officeLabel === 'Alderman')).toBe(false);
        expect(view.seats.find((s) => s.id === 'alderman')?.seats).toBe(2);
    });
});

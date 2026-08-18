import { render, screen } from '@testing-library/react';
import ElectionsPage from './ElectionsPage';
import { buildElectionView } from '@/lib/elections/view';
import { loadElection } from '@/lib/elections/load';

const strings = {
    empty: 'No election file for this city.',
    seatsHeading: 'Seats',
    namesPending: 'Certified names appear here after the Williamson County Election Commission publishes the list.',
    columnOffice: 'Office',
    columnName: 'Name',
    columnStatus: 'Status',
    statusWithdrawn: 'Withdrawn',
    datesHeading: 'Dates',
    dateQualifying: 'Qualifying deadline',
    dateWithdrawal: 'Withdrawal deadline',
    dateRegistration: 'Voter registration deadline',
    dateEarlyVote: 'Early voting',
    dateElectionDay: 'Election day',
    linksHeading: 'How to vote / how to file',
    sourceHeading: 'Source',
};

describe('ElectionsPage', () => {
    it('empty state has no name column', () => {
        render(<ElectionsPage view={null} strings={strings} />);
        expect(screen.getByText(strings.empty)).toBeInTheDocument();
        expect(screen.queryByText(strings.columnName)).toBeNull();
    });

    it('TS seats-only file has no Name header and no person-like cells', () => {
        const file = loadElection('thompsons-station')!;
        const view = buildElectionView(file, 'America/Chicago', 'en');
        render(<ElectionsPage view={view} strings={strings} />);
        expect(screen.getByText(/Mayor/)).toBeInTheDocument();
        expect(screen.getByText(/Alderman/)).toBeInTheDocument();
        expect(screen.queryByText(strings.columnName)).toBeNull();
        expect(screen.queryByText('Brian Stover')).toBeNull();
        expect(screen.queryByText('Shaun Alexander')).toBeNull();
        expect(screen.queryByText('Bob Whitmer')).toBeNull();
        expect(screen.getByText(strings.namesPending)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /public notice/i })).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
});

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import VoteAgreement from './VoteAgreement';
import { buildAgreement } from '@/lib/votes/agreement';

jest.mock('@/i18n/routing', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

const strings = {
    noNamed: 'No named votes in this range.',
    namedCount: 'Named items: {count}',
    unanimousCount: 'Unanimous: {count}',
    splitCount: 'Splits: {count}',
    coverageLine: '{name} named on {n} of {m} items',
    unreviewed: 'Unreviewed',
    inferred: 'Inferred',
    passed: 'PASSED',
    failed: 'FAILED',
};

describe('VoteAgreement', () => {
    it('shows zero counts and noNamed without a table when there are no named items', () => {
        const model = buildAgreement(
            [],
            [{ personId: 'white', name: 'Andrew White' }],
        );
        render(
            <VoteAgreement
                cityId="thompsons-station"
                timezone="America/Chicago"
                locale="en"
                model={model}
                strings={strings}
            />,
        );

        expect(screen.getByText('Named items: 0')).toBeInTheDocument();
        expect(screen.getByText('Unanimous: 0')).toBeInTheDocument();
        expect(screen.getByText('Splits: 0')).toBeInTheDocument();
        expect(screen.getByText('No named votes in this range.')).toBeInTheDocument();
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByText(/named on/)).toBeNull();
    });
});

import { render, screen } from '@testing-library/react';
import { CityResidentIntro } from './CityResidentIntro';

jest.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

describe('CityResidentIntro', () => {
    it('renders vote and election links for US cities', () => {
        render(<CityResidentIntro cityId="thompsons-station" realm="us" />);
        expect(screen.getByRole('link', { name: /how they voted/i })).toHaveAttribute(
            'href',
            '/thompsons-station/votes',
        );
        expect(screen.getByRole('link', { name: /nov 3 election/i })).toHaveAttribute(
            'href',
            '/thompsons-station/elections',
        );
        expect(screen.getByText(/not a copy of the official town website/i)).toBeInTheDocument();
    });

    it('renders nothing for non-US cities', () => {
        const { container } = render(<CityResidentIntro cityId="athens" realm="greece" />);
        expect(container).toBeEmptyDOMElement();
    });
});

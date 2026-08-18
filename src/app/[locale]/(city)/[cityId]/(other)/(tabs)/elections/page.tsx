import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCityCached } from '@/lib/cache';
import { siteBranding } from '@/lib/siteBranding';
import { buildCanonicalAlternates } from '@/lib/utils/hreflang';
import { getOgLocale } from '@/i18n/config';
import { getLocalizedName } from '@/lib/formatters/name';
import { loadElection } from '@/lib/elections/load';
import { buildElectionView } from '@/lib/elections/view';
import ElectionsPage from '@/components/elections/ElectionsPage';
import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ cityId: string; locale: string }> }): Promise<Metadata> {
    const params = await props.params;
    const t = await getTranslations({ locale: params.locale, namespace: 'metadata.elections' });
    const city = await getCityCached(params.cityId);
    if (!city) {
        return { title: t('notFoundTitle'), description: t('notFoundDescription') };
    }
    const cityName = getLocalizedName(city, params.locale);
    const { title: siteName } = siteBranding(city.realm);
    return {
        title: `${t('shortTitle', { cityName })} | ${siteName}`,
        description: t('description', { cityName }),
        openGraph: {
            title: t('shortTitle', { cityName }),
            description: t('description', { cityName }),
            siteName,
            locale: getOgLocale(params.locale),
        },
        alternates: await buildCanonicalAlternates(`/${params.cityId}/elections`),
    };
}

export default async function Page(props: { params: Promise<{ cityId: string; locale: string }> }) {
    const { cityId, locale } = await props.params;
    const city = await getCityCached(cityId);
    if (!city) notFound();
    const t = await getTranslations({ locale, namespace: 'Elections' });
    const file = loadElection(cityId);
    const view = file ? buildElectionView(file, city.timezone, locale) : null;
    return (
        <ElectionsPage
            view={view}
            strings={{
                empty: t('empty'),
                seatsHeading: t('seatsHeading'),
                namesPending: t('namesPending'),
                columnOffice: t('columnOffice'),
                columnName: t('columnName'),
                columnStatus: t('columnStatus'),
                statusWithdrawn: t('statusWithdrawn'),
                datesHeading: t('datesHeading'),
                dateQualifying: t('dateQualifying'),
                dateWithdrawal: t('dateWithdrawal'),
                dateRegistration: t('dateRegistration'),
                dateEarlyVote: t('dateEarlyVote'),
                dateElectionDay: t('dateElectionDay'),
                linksHeading: t('linksHeading'),
                sourceHeading: t('sourceHeading'),
            }}
        />
    );
}

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getAdministrativeBodiesForCityCached, getCityCached } from '@/lib/cache';
import { siteBranding } from '@/lib/siteBranding';
import { buildCanonicalAlternates } from '@/lib/utils/hreflang';
import { getOgLocale } from '@/i18n/config';
import { getLocalizedName } from '@/lib/formatters/name';
import { isUserAuthorizedToEdit } from '@/lib/auth';
import { civilDayBounds } from '@/lib/dates/civil';
import { parseVoteFeedParams } from '@/lib/votes/params';
import { loadVoteFeedData, VoteWindowTooLarge } from '@/lib/db/voteFeed';
import { chooseVotes } from '@/lib/votes/choose';
import { paginateVoted } from '@/lib/votes/paginate';
import { buildAgreement } from '@/lib/votes/agreement';
import { compareRanks } from '@/lib/sorting/people';
import { partitionUnvoted } from '@/lib/votes/unvoted';
import VoteFeed from '@/components/votes/VoteFeed';
import VoteAgreement from '@/components/votes/VoteAgreement';
import VoteFilters from '@/components/votes/VoteFilters';
import { voteFeedHrefWith } from '@/components/votes/href';
import type { Metadata } from 'next';

const PAGE_SIZE = 25;

export async function generateMetadata(props: {
    params: Promise<{ cityId: string; locale: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const t = await getTranslations({ locale: params.locale, namespace: 'metadata.votes' });
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
        alternates: await buildCanonicalAlternates(`/${params.cityId}/votes`),
    };
}

function VotesChrome({
    title,
    filters,
    children,
}: {
    title: string;
    filters: ReactNode;
    children: ReactNode;
}) {
    return (
        <article className="space-y-8">
            <header className="space-y-4">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {filters}
            </header>
            {children}
        </article>
    );
}

function messageTemplate(
    t: { raw: (key: string) => unknown },
    key: string,
): string {
    const raw = t.raw(key);
    if (typeof raw !== 'string') {
        throw new Error(`Votes.${key} must be a string`);
    }
    return raw;
}

export default async function Page(props: {
    params: Promise<{ cityId: string; locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { cityId, locale } = await props.params;
    const search = await props.searchParams;
    const [city, bodies, includeUnreleased] = await Promise.all([
        getCityCached(cityId),
        getAdministrativeBodiesForCityCached(cityId),
        isUserAuthorizedToEdit({ cityId }),
    ]);
    if (!city) notFound();

    const t = await getTranslations({ locale, namespace: 'Votes' });
    const defaultBodyId = bodies.find((body) => body.type === 'council')?.id ?? 'all';
    const parsed = parseVoteFeedParams(search, defaultBodyId);
    const knownBodyIds = new Set(bodies.map((body) => body.id));
    const bodyId =
        parsed.bodyId !== 'all' && !knownBodyIds.has(parsed.bodyId)
            ? defaultBodyId
            : parsed.bodyId;
    const params = { ...parsed, bodyId };

    const from = params.from ? civilDayBounds(params.from, city.timezone).from : null;
    const toExclusive = params.to ? civilDayBounds(params.to, city.timezone).toExclusive : null;

    const filterStrings = {
        tabFeed: t('tabFeed'),
        tabAgreement: t('tabAgreement'),
        viewSplits: t('viewSplits'),
        viewNamed: t('viewNamed'),
        viewAll: t('viewAll'),
        bodyAll: t('bodyAll'),
    };
    const filterBodies = bodies.map((body) => ({
        id: body.id,
        name: getLocalizedName(body, locale),
    }));
    const filters = (
        <VoteFilters
            cityId={cityId}
            params={params}
            defaultBodyId={defaultBodyId}
            bodies={filterBodies}
            strings={filterStrings}
            showView={params.tab === 'feed'}
        />
    );

    let data: Awaited<ReturnType<typeof loadVoteFeedData>>;
    try {
        data = await loadVoteFeedData({
            cityId,
            bodyId,
            from,
            toExclusive,
            includeUnreleased,
        });
    } catch (error) {
        if (error instanceof VoteWindowTooLarge) {
            return (
                <VotesChrome title={t('title')} filters={filters}>
                    <p>{t('narrowDates')}</p>
                </VotesChrome>
            );
        }
        throw error;
    }

    const cardStrings = {
        unreviewed: t('unreviewed'),
        inferred: t('inferred'),
        passed: t('passed'),
        failed: t('failed'),
    };

    const namedSubjects = data.voted
        .filter((subject) => chooseVotes(subject.votes).length > 0)
        .sort((a, b) => {
            const byDate = b.meetingDateTime.getTime() - a.meetingDateTime.getTime();
            if (byDate !== 0) return byDate;
            return compareRanks(a.agendaItemIndex, b.agendaItemIndex);
        });
    const { upcoming, awaiting, olderAwaitingCount } = partitionUnvoted(
        data.unvoted,
        new Date(),
        data.voted,
    );
    const votedForPerson = params.personId
        ? data.voted.filter((subject) =>
              chooseVotes(subject.votes).some((vote) => vote.personId === params.personId),
          )
        : data.voted;
    const firstPage = paginateVoted(votedForPerson, params.view, 1, PAGE_SIZE);
    const pageCount = Math.max(1, Math.ceil(firstPage.total / PAGE_SIZE));
    const page = Math.min(params.page, pageCount);
    const paged =
        page === 1
            ? firstPage
            : paginateVoted(votedForPerson, params.view, page, PAGE_SIZE);

    return (
        <VotesChrome title={t('title')} filters={filters}>
            {params.tab === 'agreement' ? (
                <VoteAgreement
                    cityId={cityId}
                    timezone={city.timezone}
                    locale={locale}
                    model={buildAgreement(namedSubjects, data.roster)}
                    strings={{
                        ...cardStrings,
                        noNamed: t('noNamed'),
                        namedCount: messageTemplate(t, 'namedCount'),
                        unanimousCount: messageTemplate(t, 'unanimousCount'),
                        splitCount: messageTemplate(t, 'splitCount'),
                        coverageLine: messageTemplate(t, 'coverageLine'),
                    }}
                />
            ) : (
                <VoteFeed
                    cityId={cityId}
                    timezone={city.timezone}
                    locale={locale}
                    upcoming={upcoming}
                    awaiting={awaiting}
                    voted={paged.items}
                    votedTotal={paged.total}
                    viewAllHref={voteFeedHrefWith(cityId, params, defaultBodyId, {
                        view: 'all',
                    })}
                    strings={{
                        onTheAgenda: t('onTheAgenda'),
                        awaitingMinutes: t('awaitingMinutes'),
                        olderAwaiting:
                            olderAwaitingCount > 0
                                ? t('olderAwaiting', { count: olderAwaitingCount })
                                : null,
                        noVotes: t('noVotes'),
                        showAllOutcomes: t('showAllOutcomes'),
                        ...cardStrings,
                    }}
                    pagination={{
                        prevHref:
                            page > 1
                                ? voteFeedHrefWith(cityId, params, defaultBodyId, {
                                      page: page - 1,
                                  })
                                : null,
                        nextHref:
                            page < pageCount && paged.total > 0
                                ? voteFeedHrefWith(cityId, params, defaultBodyId, {
                                      page: page + 1,
                                  })
                                : null,
                        page,
                        pageCount,
                    }}
                />
            )}
        </VotesChrome>
    );
}

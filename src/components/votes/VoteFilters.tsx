'use client';

import type { ReactNode } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import type { VoteFeedParams } from '@/lib/votes/params';
import { voteFeedHrefWith } from './href';

export type VoteFilterBody = {
    id: string;
    name: string;
};

export type VoteFilterStrings = {
    tabFeed: string;
    tabAgreement: string;
    viewSplits: string;
    viewNamed: string;
    viewAll: string;
    bodyAll: string;
};

function FilterLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm ${
                active
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </Link>
    );
}

export default function VoteFilters({
    cityId,
    params,
    defaultBodyId,
    bodies,
    strings,
    showView,
}: {
    cityId: string;
    params: VoteFeedParams;
    defaultBodyId: string | 'all';
    bodies: VoteFilterBody[];
    strings: VoteFilterStrings;
    showView: boolean;
}) {
    const router = useRouter();
    const href = (patch: Partial<VoteFeedParams>) =>
        voteFeedHrefWith(cityId, params, defaultBodyId, patch);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <FilterLink href={href({ tab: 'feed' })} active={params.tab === 'feed'}>
                    {strings.tabFeed}
                </FilterLink>
                <FilterLink
                    href={href({ tab: 'agreement' })}
                    active={params.tab === 'agreement'}
                >
                    {strings.tabAgreement}
                </FilterLink>
            </div>
            <div className="flex flex-wrap gap-2">
                <FilterLink href={href({ bodyId: 'all' })} active={params.bodyId === 'all'}>
                    {strings.bodyAll}
                </FilterLink>
                {bodies.map((body) => (
                    <FilterLink
                        key={body.id}
                        href={href({ bodyId: body.id })}
                        active={params.bodyId === body.id}
                    >
                        {body.name}
                    </FilterLink>
                ))}
            </div>
            {showView ? (
                <div className="flex flex-wrap gap-2">
                    <FilterLink href={href({ view: 'splits' })} active={params.view === 'splits'}>
                        {strings.viewSplits}
                    </FilterLink>
                    <FilterLink href={href({ view: 'named' })} active={params.view === 'named'}>
                        {strings.viewNamed}
                    </FilterLink>
                    <FilterLink href={href({ view: 'all' })} active={params.view === 'all'}>
                        {strings.viewAll}
                    </FilterLink>
                </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">from</span>
                    <input
                        type="date"
                        className="rounded-md border bg-background px-2 py-1"
                        value={params.from ?? ''}
                        onChange={(event) => {
                            router.push(
                                href({ from: event.target.value === '' ? null : event.target.value }),
                            );
                        }}
                    />
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">to</span>
                    <input
                        type="date"
                        className="rounded-md border bg-background px-2 py-1"
                        value={params.to ?? ''}
                        onChange={(event) => {
                            router.push(
                                href({ to: event.target.value === '' ? null : event.target.value }),
                            );
                        }}
                    />
                </label>
            </div>
        </div>
    );
}

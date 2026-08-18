import type { VoteFeedParams } from '@/lib/votes/params';

export function voteFeedHref(
    cityId: string,
    params: VoteFeedParams,
    defaultBodyId: string | 'all',
): string {
    const qs = new URLSearchParams();
    if (params.tab !== 'feed') qs.set('tab', params.tab);
    if (params.bodyId !== defaultBodyId) qs.set('body', params.bodyId);
    if (params.personId) qs.set('person', params.personId);
    if (params.view !== 'splits') qs.set('view', params.view);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.page > 1) qs.set('page', String(params.page));
    const query = qs.toString();
    return query ? `/${cityId}/votes?${query}` : `/${cityId}/votes`;
}

export function voteFeedHrefWith(
    cityId: string,
    params: VoteFeedParams,
    defaultBodyId: string | 'all',
    patch: Partial<VoteFeedParams>,
): string {
    const next: VoteFeedParams = { ...params, ...patch };
    const filterChanged =
        patch.tab !== undefined ||
        patch.bodyId !== undefined ||
        patch.view !== undefined ||
        patch.from !== undefined ||
        patch.to !== undefined ||
        patch.personId !== undefined;
    if (filterChanged && patch.page === undefined) {
        next.page = 1;
    }
    return voteFeedHref(cityId, next, defaultBodyId);
}

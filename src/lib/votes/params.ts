import type { FeedView } from './types';

export type VoteFeedParams = {
    tab: 'feed' | 'agreement';
    bodyId: string | 'all';
    personId: string | null;
    view: FeedView;
    from: string | null; // YYYY-MM-DD
    to: string | null;
    page: number;
};

const CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

function first(
    search: Record<string, string | string[] | undefined>,
    key: string,
): string | undefined {
    const raw = search[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value === '') return undefined;
    return value;
}

function parseCivilDate(raw: string | undefined): string | null {
    if (!raw || !CIVIL.test(raw)) return null;
    return raw;
}

function parsePage(raw: string | undefined): number {
    if (!raw || !/^[0-9]+$/.test(raw)) return 1;
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 1) return 1;
    return n;
}

export function parseVoteFeedParams(
    search: Record<string, string | string[] | undefined>,
    defaultBodyId: string | 'all',
): VoteFeedParams {
    const tab = first(search, 'tab');
    const view = first(search, 'view');

    return {
        tab: tab === 'feed' || tab === 'agreement' ? tab : 'feed',
        bodyId: first(search, 'body') ?? defaultBodyId,
        personId: first(search, 'person') ?? null,
        view: view === 'splits' || view === 'named' || view === 'all' ? view : 'splits',
        from: parseCivilDate(first(search, 'from')),
        to: parseCivilDate(first(search, 'to')),
        page: parsePage(first(search, 'page')),
    };
}

import { parseVoteFeedParams, voteFeedDefaultBodyId } from './params';

const DEFAULT_BODY = 'thompsons-station-boma';

function parse(search: Record<string, string | string[] | undefined>) {
    return parseVoteFeedParams(search, DEFAULT_BODY);
}

describe('parseVoteFeedParams', () => {
    it('clamps page=0 to 1', () => {
        expect(parse({ page: '0' }).page).toBe(1);
    });

    it('falls back to view=splits for an unknown view', () => {
        expect(parse({ view: 'nope' }).view).toBe('splits');
    });

    it('keeps tab=agreement', () => {
        expect(parse({ tab: 'agreement' }).tab).toBe('agreement');
    });

    it('keeps from=2026-06-09', () => {
        expect(parse({ from: '2026-06-09' }).from).toBe('2026-06-09');
    });

    it('drops from=06/09/2026', () => {
        expect(parse({ from: '06/09/2026' }).from).toBeNull();
    });

    it('uses defaults for an empty query', () => {
        expect(parse({})).toEqual({
            tab: 'feed',
            bodyId: DEFAULT_BODY,
            personId: null,
            view: 'splits',
            from: null,
            to: null,
            page: 1,
        });
    });

    it('maps body and person query keys', () => {
        expect(parse({ body: 'all' }).bodyId).toBe('all');
        expect(parse({ body: 'planning' }).bodyId).toBe('planning');
        expect(parse({ person: 'alice' }).personId).toBe('alice');
    });

    it('keeps a valid page and to date', () => {
        const result = parse({ page: '2', to: '2026-06-10' });
        expect(result.page).toBe(2);
        expect(result.to).toBe('2026-06-10');
    });

    it('falls back on invalid tab, page, and to', () => {
        const result = parse({ tab: 'nope', page: '-3', to: '06/10/2026' });
        expect(result.tab).toBe('feed');
        expect(result.page).toBe(1);
        expect(result.to).toBeNull();
    });

    it('reads the first value when a param is an array', () => {
        expect(parse({ tab: ['agreement'] }).tab).toBe('agreement');
        expect(parse({ view: ['named', 'all'] }).view).toBe('named');
    });
});

describe('voteFeedDefaultBodyId', () => {
    const bodies = [
        { id: 'planning', type: 'committee' },
        { id: 'boma', type: 'council' },
    ];

    it('defaults US to all bodies', () => {
        expect(voteFeedDefaultBodyId('us', bodies)).toBe('all');
    });

    it('defaults other realms to the council body', () => {
        expect(voteFeedDefaultBodyId('greece', bodies)).toBe('boma');
    });
});

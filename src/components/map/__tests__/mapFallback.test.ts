import { getRealmDefaultMapView } from '@/lib/realm';
import { MAP_FALLBACK_DEFAULT_CENTER, mapFallbackMessageKey } from '../mapFallback';

describe('mapFallback', () => {
    it('defaults to the US realm center, not Athens', () => {
        expect(MAP_FALLBACK_DEFAULT_CENTER).toEqual(getRealmDefaultMapView('us').center);
        expect(MAP_FALLBACK_DEFAULT_CENTER).toEqual([-86.9114, 35.8023]);
        expect(MAP_FALLBACK_DEFAULT_CENTER).not.toEqual(getRealmDefaultMapView('greece').center);
    });

    it('blames a missing Mapbox token, not WebGL, when the token is unset', () => {
        expect(mapFallbackMessageKey(false)).toBe('mapTokenMissingMessage');
        expect(mapFallbackMessageKey(true)).toBe('webglFallbackMessage');
    });
});

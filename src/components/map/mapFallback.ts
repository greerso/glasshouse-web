import { getRealmDefaultMapView } from '@/lib/realm';

/** Used when a map has no geometry and no caller-supplied center. */
export const MAP_FALLBACK_DEFAULT_CENTER = getRealmDefaultMapView('us').center;

export type MapFallbackMessageKey = 'mapTokenMissingMessage' | 'webglFallbackMessage';

export function mapFallbackMessageKey(hasMapboxToken: boolean): MapFallbackMessageKey {
    return hasMapboxToken ? 'webglFallbackMessage' : 'mapTokenMissingMessage';
}

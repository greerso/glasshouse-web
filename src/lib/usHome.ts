import type { Realm } from '@prisma/client';

export const US_HOME_PATH = '/thompsons-station';

/** Path `/` should 307 to for this realm, or null to keep the multi-city landing. */
export function homeRedirectPath(realm: Realm): string | null {
    return realm === 'us' ? US_HOME_PATH : null;
}

import type { Realm } from '@prisma/client';

export type SiteBranding = {
    title: string;
    description: string;
};

const OPENCOUNCIL: SiteBranding = {
    title: 'OpenCouncil',
    description: 'Ανοιχτή τοπική αυτοδιοίκηση',
};

const GLASSHOUSE: SiteBranding = {
    title: 'Glasshouse',
    description: 'Open local government',
};

/** Root metadata title/description for a realm. Other realms stay OpenCouncil. */
export function siteBranding(realm: Realm): SiteBranding {
    return realm === 'us' ? GLASSHOUSE : OPENCOUNCIL;
}

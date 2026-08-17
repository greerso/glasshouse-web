import { ALL_REALMS } from '../realm';
import { siteBranding } from '../siteBranding';

describe('siteBranding', () => {
    it('uses Glasshouse and an English description for the US realm', () => {
        expect(siteBranding('us')).toEqual({
            title: 'Glasshouse',
            description: 'Open local government',
        });
    });

    it('leaves every other realm as OpenCouncil', () => {
        for (const realm of ALL_REALMS) {
            if (realm === 'us') continue;
            expect(siteBranding(realm)).toEqual({
                title: 'OpenCouncil',
                description: 'Ανοιχτή τοπική αυτοδιοίκηση',
            });
        }
    });
});

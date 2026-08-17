import { ALL_REALMS } from '../realm';
import { homeRedirectPath, US_HOME_PATH } from '../usHome';

describe('homeRedirectPath', () => {
    it('sends the US realm to Thompson\'s Station', () => {
        expect(homeRedirectPath('us')).toBe(US_HOME_PATH);
        expect(US_HOME_PATH).toBe('/thompsons-station');
    });

    it('leaves every other realm on the multi-city landing', () => {
        for (const realm of ALL_REALMS) {
            if (realm === 'us') continue;
            expect(homeRedirectPath(realm)).toBeNull();
        }
    });
});

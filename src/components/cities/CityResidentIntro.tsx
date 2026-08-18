import { Link } from '@/i18n/routing';
import type { Realm } from '@prisma/client';

type CityResidentIntroProps = {
    cityId: string;
    realm: Realm;
};

/** US-only strip: the two things the town site does not have. */
export function CityResidentIntro({ cityId, realm }: CityResidentIntroProps) {
    if (realm !== 'us') return null;
    return (
        <section className="rounded-lg border bg-muted/40 p-4 md:p-5 space-y-3">
            <p className="text-sm md:text-base">
                Named roll-call votes and the November 3 ballot. Independent of Town Hall — not a copy of the official town website.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
                <Link
                    href={`/${cityId}/votes`}
                    className="block rounded-md border bg-background px-4 py-3 hover:bg-accent transition-colors"
                >
                    <div className="font-medium">How they voted</div>
                    <div className="text-sm text-muted-foreground">Splits, names, and who voted with whom</div>
                </Link>
                <Link
                    href={`/${cityId}/elections`}
                    className="block rounded-md border bg-background px-4 py-3 hover:bg-accent transition-colors"
                >
                    <div className="font-medium">Nov 3 election</div>
                    <div className="text-sm text-muted-foreground">Mayor and two alderman seats</div>
                </Link>
            </div>
        </section>
    );
}

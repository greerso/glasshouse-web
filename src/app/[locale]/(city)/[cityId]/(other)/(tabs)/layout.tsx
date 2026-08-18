import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CityHeader } from "@/components/cities/CityHeader";
import { CityNavigation } from "@/components/cities/CityNavigation";
import { getCityCached, getCityMessageCached, getPartiesForCityCached, getPeopleForCityCached } from "@/lib/cache";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationPreferenceForCity } from "@/lib/db/notifications";

export default async function TabsLayout(
    props: {
        children: React.ReactNode,
        params: Promise<{ cityId: string }>
    }
) {
    const params = await props.params;

    const {
        cityId
    } = params;

    const {
        children
    } = props;

    const [city, cityMessage, parties, people, currentUser] = await Promise.all([
        getCityCached(cityId),
        getCityMessageCached(cityId),
        getPartiesForCityCached(cityId),
        getPeopleForCityCached(cityId),
        getCurrentUser()
    ]);

    if (!city) {
        notFound();
    }

    // Check if city has no data (eligible for city creator)
    const hasNoData = city._count.councilMeetings === 0 && parties.length === 0 && people.length === 0;

    const hasNotifications = currentUser
        ? !!(await getNotificationPreferenceForCity(currentUser.id, cityId))
        : false;

    const us = city.realm === 'us';

    return (
        <div className={`relative md:container md:mx-auto px-4 md:px-8 z-0 ${us ? 'py-6 space-y-6' : 'py-8 space-y-8'}`}>
            <div className={us ? 'space-y-5' : 'space-y-8'}>
                <CityHeader
                    city={city}
                    councilMeetingsCount={city._count.councilMeetings}
                    cityMessage={cityMessage}
                    hasNoData={hasNoData}
                    hasNotifications={hasNotifications}
                />

                <CityNavigation cityId={cityId} city={city} showParties={!us && parties.length > 0} />

                <Suspense fallback={
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                }>
                    <div className="space-y-4 md:space-y-6">
                        {children}
                    </div>
                </Suspense>
            </div>
        </div>
    );
} 
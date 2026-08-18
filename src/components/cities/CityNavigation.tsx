"use client";
import { useTranslations } from 'next-intl';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type CityNavigationProps = {
    cityId: string;
    city?: { consultationsEnabled: boolean; realm?: string };
    showParties?: boolean;
};

// Custom NavLink component to handle active state styling
type NavLinkProps = {
    href: string;
    children: ReactNode;
    segment: string | null;
    matchSegment: string | null;
    alsoMatch?: string;
    activeClassName?: string;
    inactiveClassName?: string;
};

function NavLink({
    href,
    children,
    segment,
    matchSegment,
    alsoMatch,
    activeClassName = 'bg-background text-foreground shadow-sm',
    inactiveClassName = 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
}: NavLinkProps) {
    const isActive = segment === matchSegment || (alsoMatch !== undefined && segment === alsoMatch);
    const className = `px-2 sm:px-3 md:px-6 py-2 text-xs sm:text-sm md:text-base whitespace-nowrap transition-colors rounded-md flex-shrink-0 ${isActive ? activeClassName : inactiveClassName
        }`;

    return (
        <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
            {children}
        </Link>
    );
}

export function CityNavigation({ cityId, city, showParties = true }: CityNavigationProps) {
    const t = useTranslations('City');
    const segment = useSelectedLayoutSegment();
    const us = city?.realm === 'us';
    const currentSegment = us ? segment : (segment || 'meetings');

    return (
        <motion.div
            initial={us ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: us ? 0 : 0.7 }}
            className="flex justify-center mb-6 md:mb-8"
        >
            <nav aria-label={t('citySections')} className="gap-1 sm:gap-2 md:gap-8 p-1 bg-background/80 backdrop-blur-sm w-full max-w-4xl flex justify-center rounded-lg overflow-x-auto scrollbar-hide">
                {us ? (
                    <NavLink href={`/${cityId}`} segment={currentSegment} matchSegment={null} alsoMatch="votes">
                            {t('votes')}
                        </NavLink>
                ) : (
                <NavLink
                    href={`/${cityId}`}
                    segment={currentSegment}
                    matchSegment="meetings"
                >
                    {t('councilMeetings')}
                </NavLink>
                )}
                {us && (
                <NavLink
                    href={`/${cityId}/elections`}
                    segment={currentSegment}
                    matchSegment="elections"
                >
                    {t('elections')}
                </NavLink>
                )}
                <NavLink
                    href={`/${cityId}/people`}
                    segment={currentSegment}
                    matchSegment="people"
                >
                    {t('people')}
                </NavLink>
                {!us && (
                <NavLink
                    href={`/${cityId}/elections`}
                    segment={currentSegment}
                    matchSegment="elections"
                >
                    {t('elections')}
                </NavLink>
                )}
                {us ? (
                <NavLink
                    href={`/${cityId}/meetings`}
                    segment={currentSegment}
                    matchSegment="meetings"
                >
                    {t('archive')}
                </NavLink>
                ) : (
                <NavLink
                    href={`/${cityId}/votes`}
                    segment={currentSegment}
                    matchSegment="votes"
                >
                    {t('votes')}
                </NavLink>
                )}
                {showParties && (
                <NavLink
                    href={`/${cityId}/parties`}
                    segment={currentSegment}
                    matchSegment="parties"
                >
                    {t('parties')}
                </NavLink>
                )}
                {city?.consultationsEnabled && (
                    <NavLink
                        href={`/${cityId}/consultations`}
                        segment={currentSegment}
                        matchSegment="consultations"
                    >
                        {t('consultations')}
                    </NavLink>
                )}
            </nav>
        </motion.div>
    );
} 
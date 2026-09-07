"use client"

import type { ReactNode } from 'react'
import type { Realm } from '@prisma/client'
import { Phone, Mail } from 'lucide-react'
import { getRealmContactEmail, getRealmContactPhone, telHref } from '@/lib/realm'

/**
 * The "need help?" card on the error and 404 pages.
 *
 * Renders nothing when the realm publishes no contact channel — offering to be
 * contacted with no way to do it is worse than staying quiet. The us realm hit
 * exactly that: it advertised the OpenCouncil inbox and a `tel:` link built
 * from an address at the unregistered glasshouse.town.
 */
export default function RealmContactCard({
    realm,
    title,
    description,
}: {
    realm: Realm
    title: string
    description: ReactNode
}) {
    const phone = getRealmContactPhone(realm)
    const email = getRealmContactEmail(realm)
    if (!phone && !email) return null

    return (
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-lg font-medium mb-4">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {phone && (
                    <a
                        href={telHref(phone)}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Phone className="w-4 h-4 mr-2" />
                        {phone}
                    </a>
                )}
                {email && (
                    <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        {email}
                    </a>
                )}
            </div>
        </div>
    )
}

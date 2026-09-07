"use client"

import { useEffect } from 'react'
import { useRealm } from '@/hooks/useRealm'
import RealmContactCard from '@/components/layout/RealmContactCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, RotateCcw, AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    const realm = useRealm()

    useEffect(() => {
        // Log to console for client-side diagnostics; onRequestError handles server-side alerting.
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
                <div className="mb-8 flex justify-center">
                    <div className="p-6 rounded-full bg-[hsl(var(--orange))]/10">
                        <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-[hsl(var(--orange))]" />
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                    Κάτι πήγε στραβά
                </h2>

                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκιμάστε ξανά ή επιστρέψτε στην αρχική σελίδα.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button onClick={reset} size="lg" className="min-w-[200px]">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Δοκιμάστε ξανά
                    </Button>

                    <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Αρχική Σελίδα
                        </Link>
                    </Button>
                </div>

                <RealmContactCard
                    realm={realm}
                    title="Χρειάζεστε βοήθεια;"
                    description={
                        <>
                            Αν το πρόβλημα επιμένει, επικοινωνήστε μαζί μας
                            {error.digest ? (
                                <> και αναφέρετε τον κωδικό: <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">{error.digest}</code></>
                            ) : '.'}
                        </>
                    }
                />
            </div>
        </div>
    )
}

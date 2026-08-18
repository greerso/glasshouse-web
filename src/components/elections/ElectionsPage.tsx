import type { ElectionView } from '@/lib/elections/view';

export type ElectionsPageStrings = {
    empty: string;
    seatsHeading: string;
    namesPending: string;
    columnOffice: string;
    columnName: string;
    columnStatus: string;
    statusWithdrawn: string;
    datesHeading: string;
    dateQualifying: string;
    dateWithdrawal: string;
    dateRegistration: string;
    dateEarlyVote: string;
    dateElectionDay: string;
    linksHeading: string;
    sourceHeading: string;
};

const DATE_HEADING: Record<string, keyof ElectionsPageStrings> = {
    qualifying: 'dateQualifying',
    withdrawal: 'dateWithdrawal',
    registration: 'dateRegistration',
    earlyVote: 'dateEarlyVote',
    electionDay: 'dateElectionDay',
};

function dateHeading(key: string, strings: ElectionsPageStrings): string {
    const stringKey = DATE_HEADING[key];
    if (!stringKey) {
        throw new Error(`Unknown election date key: ${key}`);
    }
    return strings[stringKey];
}

export default function ElectionsPage({
    view,
    strings,
}: {
    view: ElectionView | null;
    strings: ElectionsPageStrings;
}) {
    if (!view) {
        return <p>{strings.empty}</p>;
    }

    return (
        <article className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{view.title}</h1>
                <p className="text-muted-foreground">{view.electionDateLabel}</p>
            </header>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">{strings.seatsHeading}</h2>
                <ul className="space-y-1">
                    {view.seats.map((seat) => (
                        <li key={seat.id}>
                            {seat.label} ({seat.seats} seat(s))
                        </li>
                    ))}
                </ul>
                {!view.showNameColumn && <p>{strings.namesPending}</p>}
                {view.showNameColumn && (
                    <table className="w-full caption-bottom text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    {strings.columnOffice}
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    {strings.columnName}
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    {strings.columnStatus}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {view.candidateRows.map((row) => (
                                <tr key={`${row.officeLabel}:${row.name}:${row.sourceUrl}`} className="border-b">
                                    <td className="p-4 align-middle">{row.officeLabel}</td>
                                    <td className="p-4 align-middle">
                                        <a
                                            href={row.sourceUrl}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            className="underline"
                                        >
                                            {row.name}
                                        </a>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {row.status === 'withdrawn' ? strings.statusWithdrawn : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">{strings.datesHeading}</h2>
                <dl className="space-y-2">
                    {view.dates.map((date) => (
                        <div key={date.key} className="grid gap-1 sm:grid-cols-[minmax(12rem,14rem)_1fr]">
                            <dt className="text-muted-foreground">{dateHeading(date.key, strings)}</dt>
                            <dd>{date.label}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">{strings.linksHeading}</h2>
                <ul className="space-y-2">
                    {view.links.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                rel="noopener noreferrer"
                                target="_blank"
                                className="underline"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">{strings.sourceHeading}</h2>
                <p>{view.sourceNote}</p>
                <p className="text-sm text-muted-foreground">{view.lastCapturedAt}</p>
            </section>
        </article>
    );
}

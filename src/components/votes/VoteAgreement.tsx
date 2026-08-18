import { formatDate } from '@/lib/formatters/time';
import { formatSurnameFirst } from '@/lib/formatters/name';
import type { AgreementModel, PairCell } from '@/lib/votes/agreement';
import { VotedSubjectCard, type VoteFeedStrings } from './VoteFeed';

export type VoteAgreementStrings = Pick<
    VoteFeedStrings,
    'unreviewed' | 'inferred' | 'passed' | 'failed'
> & {
    noNamed: string;
    namedCount: string;
    unanimousCount: string;
    splitCount: string;
    coverageLine: string;
};

function fillTemplate(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : `{${key}}`,
    );
}

function pairOf(pairs: PairCell[], aId: string, bId: string): PairCell | undefined {
    return pairs.find(
        (pair) => (pair.aId === aId && pair.bId === bId) || (pair.aId === bId && pair.bId === aId),
    );
}

function pairLabel(agreed: number, both: number): string {
    if (both === 0) return '0 / 0';
    return `${agreed} / ${both} (${Math.round((agreed / both) * 100)}%)`;
}

export default function VoteAgreement({
    cityId,
    timezone,
    locale,
    model,
    strings,
}: {
    cityId: string;
    timezone: string;
    locale: string;
    model: AgreementModel;
    strings: VoteAgreementStrings;
}) {
    const matrixPeople = model.people.filter((person) => person.namedCount > 0);

    return (
        <div className="space-y-8">
            <section className="space-y-1">
                <p>{fillTemplate(strings.namedCount, { count: model.namedItems })}</p>
                <p>{fillTemplate(strings.unanimousCount, { count: model.unanimousCount })}</p>
                <p>{fillTemplate(strings.splitCount, { count: model.splitCount })}</p>
                {model.dateFrom && model.dateTo ? (
                    <p className="text-sm text-muted-foreground">
                        {formatDate(model.dateFrom, timezone, locale)}
                        {' – '}
                        {formatDate(model.dateTo, timezone, locale)}
                    </p>
                ) : null}
            </section>

            {model.namedItems === 0 ? <p>{strings.noNamed}</p> : null}

            {model.namedItems > 0 && matrixPeople.length >= 2 ? (
                <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" />
                                {matrixPeople.map((person) => (
                                    <th
                                        key={person.personId}
                                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                                    >
                                        {formatSurnameFirst(person.name)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrixPeople.map((row) => (
                                <tr key={row.personId} className="border-b">
                                    <th className="p-4 text-left align-middle font-medium">
                                        {formatSurnameFirst(row.name)}
                                    </th>
                                    {matrixPeople.map((col) => {
                                        if (row.personId === col.personId) {
                                            return (
                                                <td key={col.personId} className="p-4 align-middle">
                                                    —
                                                </td>
                                            );
                                        }
                                        const pair = pairOf(model.pairs, row.personId, col.personId);
                                        return (
                                            <td
                                                key={col.personId}
                                                className="p-4 align-middle tabular-nums"
                                            >
                                                {pair ? pairLabel(pair.agreed, pair.both) : '0 / 0'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {model.namedItems > 0 && model.people.length > 0 ? (
                <ul className="space-y-1">
                    {model.people.map((person) => (
                        <li key={person.personId}>
                            {fillTemplate(strings.coverageLine, {
                                name: formatSurnameFirst(person.name),
                                n: person.namedCount,
                                m: model.namedItems,
                            })}
                        </li>
                    ))}
                </ul>
            ) : null}

            {model.namedItems > 0 && model.splits.length > 0
                ? model.splits.map((subject) => (
                      <VotedSubjectCard
                          key={subject.subjectId}
                          cityId={cityId}
                          subject={subject}
                          timezone={timezone}
                          locale={locale}
                          strings={strings}
                      />
                  ))
                : null}
        </div>
    );
}

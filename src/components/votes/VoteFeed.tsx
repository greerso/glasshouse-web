import { Link } from '@/i18n/routing';
import { formatDate } from '@/lib/formatters/time';
import { calculateVoteResult } from '@/lib/utils/votes';
import { chooseVotes } from '@/lib/votes/choose';
import { plainSubjectName, surnameOf } from '@/lib/votes/display';
import type { ChosenVote, VotedSubject } from '@/lib/votes/types';
import { Badge } from '@/components/ui/badge';

export type VoteFeedUnvoted = {
    subjectId: string;
    subjectName: string;
    meetingId: string;
    meetingDateTime: Date;
    bodyName: string;
};

export type VoteFeedStrings = {
    onTheAgenda: string;
    awaitingMinutes: string;
    olderAwaiting: string | null;
    noVotes: string;
    showAllOutcomes: string;
    unreviewed: string;
    inferred: string;
    passed: string;
    failed: string;
};

export type VoteFeedPagination = {
    prevHref: string | null;
    nextHref: string | null;
    page: number;
    pageCount: number;
};

function formatVoteTally(yay: number, nay: number, abstain: number): string {
    return abstain > 0 ? `${yay}–${nay}–${abstain}` : `${yay}–${nay}`;
}

function tallyFromChosen(chosen: ChosenVote[]): { yay: number; nay: number; abstain: number } {
    let yay = 0;
    let nay = 0;
    let abstain = 0;
    for (const vote of chosen) {
        if (vote.voteType === 'FOR') yay += 1;
        else if (vote.voteType === 'AGAINST') nay += 1;
        else if (vote.voteType === 'ABSTAIN') abstain += 1;
    }
    return { yay, nay, abstain };
}

export function votedCardModel(subject: VotedSubject): {
    tally: string;
    outcome: 'PASSED' | 'FAILED';
    title: string;
    names: { personId: string; label: string; voteType: ChosenVote['voteType'] }[];
    unreviewed: boolean;
    inferred: boolean;
} {
    const chosen = chooseVotes(subject.votes);
    const counts = subject.result
        ? {
              yay: subject.result.yayCount,
              nay: subject.result.nayCount,
              abstain: subject.result.abstainCount,
          }
        : tallyFromChosen(chosen);
    const outcome = subject.result
        ? subject.result.outcome
        : calculateVoteResult(chosen).passed
          ? 'PASSED'
          : 'FAILED';
    return {
        tally: formatVoteTally(counts.yay, counts.nay, counts.abstain),
        outcome,
        title: plainSubjectName(subject.subjectName),
        names: chosen.map((vote) => ({
            personId: vote.personId,
            label: surnameOf(vote.personName),
            voteType: vote.voteType,
        })),
        unreviewed:
            chosen.some((vote) => vote.reviewStatus === 'unreviewed') ||
            subject.result?.reviewStatus === 'unreviewed',
        inferred:
            chosen.some((vote) => vote.source === 'inferred') ||
            subject.result?.source === 'inferred',
    };
}

function subjectHref(cityId: string, meetingId: string, subjectId: string): string {
    return `/${cityId}/${meetingId}/subjects/${subjectId}`;
}

function groupByMeeting<T extends { meetingId: string }>(items: T[]): T[][] {
    const order: string[] = [];
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const existing = groups.get(item.meetingId);
        if (existing) {
            existing.push(item);
        } else {
            groups.set(item.meetingId, [item]);
            order.push(item.meetingId);
        }
    }
    return order.map((id) => groups.get(id)!);
}

type OutcomeStrings = Pick<VoteFeedStrings, 'unreviewed' | 'inferred' | 'passed' | 'failed'>;

export function VotedSubjectCard({
    cityId,
    subject,
    timezone,
    locale,
    strings,
}: {
    cityId: string;
    subject: VotedSubject;
    timezone: string;
    locale: string;
    strings: OutcomeStrings;
}) {
    const model = votedCardModel(subject);
    return (
        <article className="grid gap-3 border-b py-6 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-6">
            <div className="sm:pt-1">
                <p className="text-3xl font-semibold tabular-nums tracking-tight">{model.tally}</p>
                <p className={`text-sm font-medium ${model.outcome === 'FAILED' ? 'text-destructive' : 'text-foreground'}`}>
                    {model.outcome === 'PASSED' ? strings.passed : strings.failed}
                </p>
            </div>
            <div className="space-y-2 min-w-0">
                <p className="text-sm text-muted-foreground">
                    {formatDate(subject.meetingDateTime, timezone, locale)}
                    {' · '}
                    {subject.bodyName}
                </p>
                <h3 className="text-xl font-semibold leading-snug">
                    <Link
                        href={subjectHref(cityId, subject.meetingId, subject.subjectId)}
                        className="hover:underline underline-offset-4"
                    >
                        {model.title}
                    </Link>
                </h3>
                {model.names.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                        {model.names.map((name) => (
                            <li
                                key={name.personId}
                                className={`rounded-full border px-2.5 py-0.5 text-sm ${
                                    name.voteType === 'FOR'
                                        ? 'border-emerald-700/30 bg-emerald-50 text-emerald-900'
                                        : name.voteType === 'AGAINST'
                                          ? 'border-red-700/30 bg-red-50 text-red-900'
                                          : 'border-border bg-muted text-muted-foreground'
                                }`}
                            >
                                {name.label} {name.voteType === 'FOR' ? 'yes' : name.voteType === 'AGAINST' ? 'no' : name.voteType.toLowerCase()}
                            </li>
                        ))}
                    </ul>
                ) : null}
                <div className="flex flex-wrap gap-2">
                    {model.unreviewed && (
                        <Badge variant="outline">{strings.unreviewed}</Badge>
                    )}
                    {model.inferred && <Badge variant="outline">{strings.inferred}</Badge>}
                </div>
            </div>
        </article>
    );
}

function UnvotedSection({
    heading,
    items,
    cityId,
    timezone,
    locale,
    footer,
}: {
    heading: string;
    items: VoteFeedUnvoted[];
    cityId: string;
    timezone: string;
    locale: string;
    footer?: string | null;
}) {
    if (items.length === 0) return null;
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">{heading}</h2>
            {groupByMeeting(items).map((group) => (
                <div key={group[0].meetingId} className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {formatDate(group[0].meetingDateTime, timezone, locale)}
                        {' · '}
                        {group[0].bodyName}
                    </p>
                    <ul className="space-y-2">
                        {group.map((item) => (
                            <li key={item.subjectId}>
                                <Link
                                    href={subjectHref(cityId, item.meetingId, item.subjectId)}
                                    className="underline-offset-4 hover:underline"
                                >
                                    {plainSubjectName(item.subjectName)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            {footer ? <p className="text-sm text-muted-foreground">{footer}</p> : null}
        </section>
    );
}

export default function VoteFeed({
    cityId,
    timezone,
    locale,
    upcoming,
    awaiting,
    voted,
    votedTotal,
    viewAllHref,
    strings,
    pagination,
}: {
    cityId: string;
    timezone: string;
    locale: string;
    upcoming: VoteFeedUnvoted[];
    awaiting: VoteFeedUnvoted[];
    voted: VotedSubject[];
    votedTotal: number;
    viewAllHref: string;
    strings: VoteFeedStrings;
    pagination?: VoteFeedPagination;
}) {
    return (
        <div className="space-y-8">
            {votedTotal === 0 ? (
                <div className="space-y-2">
                    <p>{strings.noVotes}</p>
                    <p>
                        <Link href={viewAllHref} className="underline underline-offset-4">
                            {strings.showAllOutcomes}
                        </Link>
                    </p>
                </div>
            ) : (
                <section className="space-y-4">
                    <p className="text-sm text-muted-foreground tabular-nums">
                        {voted.length} / {votedTotal}
                    </p>
                    {voted.map((subject) => (
                        <VotedSubjectCard
                            key={subject.subjectId}
                            cityId={cityId}
                            subject={subject}
                            timezone={timezone}
                            locale={locale}
                            strings={strings}
                        />
                    ))}
                    {pagination && pagination.pageCount > 1 ? (
                        <nav className="flex items-center gap-4 text-sm">
                            {pagination.prevHref ? (
                                <Link href={pagination.prevHref} className="underline underline-offset-4">
                                    {pagination.page - 1}
                                </Link>
                            ) : null}
                            <span className="tabular-nums">
                                {pagination.page} / {pagination.pageCount}
                            </span>
                            {pagination.nextHref ? (
                                <Link href={pagination.nextHref} className="underline underline-offset-4">
                                    {pagination.page + 1}
                                </Link>
                            ) : null}
                        </nav>
                    ) : null}
                </section>
            )}
            <UnvotedSection
                heading={strings.awaitingMinutes}
                items={awaiting}
                cityId={cityId}
                timezone={timezone}
                locale={locale}
                footer={strings.olderAwaiting}
            />
            <UnvotedSection
                heading={strings.onTheAgenda}
                items={upcoming}
                cityId={cityId}
                timezone={timezone}
                locale={locale}
            />
        </div>
    );
}

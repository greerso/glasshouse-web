import { formatCivilDate, formatOffsetInZone } from '@/lib/dates/civil';
import type { ElectionFile } from './schema';

export type ElectionView = {
    title: string;
    electionDateLabel: string;
    seats: { id: string; label: string; seats: number }[];
    showNameColumn: boolean;
    candidateRows: {
        officeLabel: string;
        name: string;
        status: 'qualified' | 'withdrawn';
        sourceUrl: string;
    }[];
    dates: { key: string; label: string }[];
    links: { label: string; href: string }[];
    sourceNote: string;
    lastCapturedAt: string;
};

export function buildElectionView(
    file: ElectionFile,
    timeZone: string,
    locale: string,
): ElectionView {
    const officeById = new Map(file.offices.map((o) => [o.id, o]));

    return {
        title: file.title,
        electionDateLabel: formatCivilDate(file.electionDate, locale),
        seats: file.offices.map((o) => ({ id: o.id, label: o.label, seats: o.seats })),
        showNameColumn: file.candidates.length > 0,
        candidateRows: file.candidates.map((c) => ({
            officeLabel: officeById.get(c.officeId)!.label,
            name: c.name,
            status: c.status,
            sourceUrl: c.sourceUrl,
        })),
        dates: [
            {
                key: 'qualifying',
                label: formatOffsetInZone(file.dates.qualifyingClose, timeZone, locale),
            },
            {
                key: 'withdrawal',
                label: formatOffsetInZone(file.dates.withdrawalClose, timeZone, locale),
            },
            {
                key: 'registration',
                label: formatOffsetInZone(file.dates.registrationDeadline, timeZone, locale),
            },
            {
                key: 'earlyVote',
                label: `${formatCivilDate(file.dates.earlyVoteStart, locale)} – ${formatCivilDate(file.dates.earlyVoteEnd, locale)}`,
            },
            {
                key: 'electionDay',
                label: formatCivilDate(file.dates.electionDay, locale),
            },
        ],
        links: file.links.map((l) => ({ label: l.label, href: l.href })),
        sourceNote: file.sourceNote,
        lastCapturedAt: file.lastCapturedAt,
    };
}

export type UnvotedKind = 'upcoming' | 'awaiting';

const EXACT_PROCEDURAL = new Set([
    'meeting called to order',
    'adjourn',
    'adjournment',
    'pledge',
    'pledge of allegiance',
    'invocation',
    'roll call',
    'announcements',
    'public comments',
    'public comment',
    'agenda items',
]);

// `consent` is not in the plan regex; Consent Agenda is a voteable parent card
// (design + Task 3 test: Consent stays), so treat it as substantive.
const SUBSTANTIVE_WORD =
    /motion|ordinance|resolution|consideration|approval|hearing|amendment|contract|purchase|agreement|permit|plat|bond|budget|consent/i;

function normalizeSubjectName(name: string): string {
    const trimmed = name.trim();
    const withoutColon = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
    return withoutColon.trim().toLowerCase();
}

export function isProceduralSubjectName(name: string): boolean {
    const originalTrimmed = name.trim();
    const normalized = normalizeSubjectName(name);

    if (EXACT_PROCEDURAL.has(normalized)) {
        return true;
    }

    if (!originalTrimmed.endsWith(':')) {
        return false;
    }

    return !SUBSTANTIVE_WORD.test(normalized);
}

export function unvotedKind(meetingDateTime: Date, now: Date): UnvotedKind {
    return meetingDateTime >= now ? 'upcoming' : 'awaiting';
}

export function isCancelledMeetingName(name: string): boolean {
    return /\(CANCELLED\)/i.test(name);
}

export const AWAITING_MEETING_CAP = 5;

type AwaitingMeetingSubject = {
    meetingId: string;
    meetingDateTime: Date;
};

type UnvotedFeedLike = AwaitingMeetingSubject & {
    subjectName: string;
    meetingName: string;
};

export function selectAwaitingMeetings<T extends AwaitingMeetingSubject>(
    subjects: T[],
    cap: number = AWAITING_MEETING_CAP,
): { awaiting: T[]; olderCount: number } {
    const byMeeting = new Map<string, T[]>();
    for (const subject of subjects) {
        const group = byMeeting.get(subject.meetingId);
        if (group) group.push(subject);
        else byMeeting.set(subject.meetingId, [subject]);
    }
    const meetings = [...byMeeting.values()].sort(
        (a, b) => a[0].meetingDateTime.getTime() - b[0].meetingDateTime.getTime(),
    );
    const olderCount = Math.max(0, meetings.length - cap);
    return { awaiting: meetings.slice(-cap).flat(), olderCount };
}

export function partitionUnvoted<T extends UnvotedFeedLike>(
    unvoted: T[],
    now: Date,
    voted: { meetingId: string }[],
): {
    upcoming: T[];
    awaiting: T[];
    olderAwaitingCount: number;
} {
    const votedMeetingIds = new Set(voted.map((subject) => subject.meetingId));
    const kept = unvoted.filter(
        (subject) =>
            !isCancelledMeetingName(subject.meetingName) &&
            !isProceduralSubjectName(subject.subjectName),
    );
    const upcoming = kept
        .filter((subject) => unvotedKind(subject.meetingDateTime, now) === 'upcoming')
        .sort((a, b) => b.meetingDateTime.getTime() - a.meetingDateTime.getTime());

    // Minutes already exist when any subject on the meeting is voted.
    // Do not list leftover unvoted siblings (consent children) as awaiting.
    const awaitingSubjects = kept.filter(
        (subject) =>
            unvotedKind(subject.meetingDateTime, now) === 'awaiting' &&
            !votedMeetingIds.has(subject.meetingId),
    );
    const { awaiting, olderCount } = selectAwaitingMeetings(awaitingSubjects);
    return { upcoming, awaiting, olderAwaitingCount: olderCount };
}

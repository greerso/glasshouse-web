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

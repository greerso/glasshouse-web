import {
    isCancelledMeetingName,
    isProceduralSubjectName,
    unvotedKind,
} from './unvoted';

describe('isProceduralSubjectName', () => {
    it.each([
        'Announcements:',
        'Public Comments:',
        'Agenda Items:',
        'Meeting Called to Order',
    ])('skips ChampDS procedural title %j', (name) => {
        expect(isProceduralSubjectName(name)).toBe(true);
    });

    it.each([
        'Consent Agenda:',
        'Consideration of Ordinance 2026-014',
    ])('keeps ChampDS substantive title %j', (name) => {
        expect(isProceduralSubjectName(name)).toBe(false);
    });

    it.each([
        'Adjourn',
        'Adjournment',
        'Pledge',
        'Pledge of Allegiance',
        'Invocation',
        'Roll Call',
        'Public Comment:',
        '  Meeting Called to Order:  ',
    ])('skips exact procedural name %j', (name) => {
        expect(isProceduralSubjectName(name)).toBe(true);
    });

    it('keeps roll call vote titles that are not exact roll call', () => {
        expect(isProceduralSubjectName('Roll Call Vote on Ordinance 2026-014')).toBe(
            false,
        );
    });

    it('skips colon section headers without substantive keywords', () => {
        expect(isProceduralSubjectName('Old Business:')).toBe(true);
        expect(isProceduralSubjectName('Staff Reports:')).toBe(true);
    });

    it('keeps colon titles that contain a substantive keyword', () => {
        expect(isProceduralSubjectName('Budget Workshop:')).toBe(false);
        expect(isProceduralSubjectName('Hearing Items:')).toBe(false);
    });
});

describe('isCancelledMeetingName', () => {
    it('detects (CANCELLED) in the meeting name', () => {
        expect(isCancelledMeetingName('(CANCELLED) Utility Board')).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(isCancelledMeetingName('(cancelled) Utility Board')).toBe(true);
    });

    it('returns false when CANCELLED is absent', () => {
        expect(isCancelledMeetingName('Utility Board')).toBe(false);
    });
});

describe('unvotedKind', () => {
    const now = new Date('2026-08-11T12:00:00.000Z');

    it('returns awaiting when the meeting is in the past', () => {
        expect(unvotedKind(new Date('2026-08-11T11:59:59.000Z'), now)).toBe(
            'awaiting',
        );
    });

    it('returns upcoming when the meeting is now or in the future', () => {
        expect(unvotedKind(now, now)).toBe('upcoming');
        expect(unvotedKind(new Date('2026-08-11T12:00:01.000Z'), now)).toBe(
            'upcoming',
        );
    });
});

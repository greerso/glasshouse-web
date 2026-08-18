import {
    isCancelledMeetingName,
    isProceduralSubjectName,
    partitionUnvoted,
    selectAwaitingMeetings,
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

function awaitingSubject(
    meetingId: string,
    meetingDateTime: string,
    subjectId = meetingId,
) {
    return {
        subjectId,
        subjectName: subjectId,
        meetingId,
        meetingDateTime: new Date(meetingDateTime),
        meetingName: 'Board of Mayor and Aldermen',
    };
}

describe('selectAwaitingMeetings', () => {
    it('keeps the 5 most recent of 7 meetings and reports 2 older', () => {
        const subjects = [
            awaitingSubject('2023-01', '2023-01-10T23:00:00.000Z'),
            awaitingSubject('2023-03', '2023-03-14T23:00:00.000Z'),
            awaitingSubject('2023-06', '2023-06-13T23:00:00.000Z'),
            awaitingSubject('2024-02', '2024-02-13T23:00:00.000Z'),
            awaitingSubject('2025-01', '2025-01-14T23:00:00.000Z'),
            awaitingSubject('2026-05', '2026-05-12T23:00:00.000Z'),
            awaitingSubject('2026-08', '2026-08-11T23:00:00.000Z'),
        ];

        const { awaiting, olderCount } = selectAwaitingMeetings(subjects);

        expect(olderCount).toBe(2);
        expect(awaiting.map((subject) => subject.meetingId)).toEqual([
            '2023-06',
            '2024-02',
            '2025-01',
            '2026-05',
            '2026-08',
        ]);
    });
});

describe('partitionUnvoted', () => {
    const now = new Date('2026-08-18T12:00:00.000Z');

    it('does not list consent children as awaiting after the parent was voted', () => {
        const meetingDateTime = new Date('2026-08-11T23:00:00.000Z');
        const unvoted = [
            {
                subjectId: 'minutes',
                subjectName: 'Approval of the Minutes of the July 14, 2026 Meeting',
                meetingId: 'aug-11',
                meetingDateTime,
                meetingName: 'Board of Mayor and Aldermen',
            },
            {
                subjectId: 'contract',
                subjectName: 'Approval Contract with Vendor',
                meetingId: 'aug-11',
                meetingDateTime,
                meetingName: 'Board of Mayor and Aldermen',
            },
        ];
        const voted = [
            {
                subjectId: 'consent',
                subjectName: 'Consent Agenda:',
                meetingId: 'aug-11',
                meetingDateTime,
                result: {
                    yayCount: 5,
                    nayCount: 0,
                    abstainCount: 0,
                    outcome: 'PASSED' as const,
                },
            },
        ];

        const { awaiting, upcoming, olderAwaitingCount } = partitionUnvoted(
            unvoted,
            now,
            voted,
        );

        expect(awaiting).toEqual([]);
        expect(upcoming).toEqual([]);
        expect(olderAwaitingCount).toBe(0);
    });

    it('still lists unvoted agenda items on upcoming meetings that have a voted parent', () => {
        const meetingDateTime = new Date('2026-09-08T23:00:00.000Z');
        const child = {
            subjectId: 'minutes',
            subjectName: 'Approval of the Minutes of the July 14, 2026 Meeting',
            meetingId: 'sept-8',
            meetingDateTime,
            meetingName: 'Board of Mayor and Aldermen',
        };

        const { upcoming, awaiting } = partitionUnvoted([child], now, [
            { meetingId: 'sept-8' },
        ]);

        expect(upcoming).toEqual([child]);
        expect(awaiting).toEqual([]);
    });
});

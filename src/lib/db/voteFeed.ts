import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { isRoleActiveAt } from '@/lib/utils/roles';
import type { RawVote, ResultCounts, VotedSubject } from '@/lib/votes/types';

const VOTED_WINDOW_CAP = 2000;

export class VoteWindowTooLarge extends Error {
    constructor() {
        super('narrow from/to');
        this.name = 'VoteWindowTooLarge';
    }
}

export type UnvotedFeedSubject = {
    subjectId: string;
    subjectName: string;
    meetingId: string;
    meetingDateTime: Date;
    meetingName: string;
    bodyId: string | null;
    bodyName: string;
    withdrawn: boolean;
};

type MeetingBody = {
    id: string;
    dateTime: Date;
    name: string;
    administrativeBodyId: string | null;
    administrativeBody: { id: string; name: string } | null;
};

function meetingFilter(args: {
    bodyId: string | 'all';
    from: Date | null;
    toExclusive: Date | null;
    includeUnreleased: boolean;
}): Prisma.CouncilMeetingWhereInput {
    const dateTime =
        args.from || args.toExclusive
            ? {
                  ...(args.from ? { gte: args.from } : {}),
                  ...(args.toExclusive ? { lt: args.toExclusive } : {}),
              }
            : undefined;

    return {
        ...(args.includeUnreleased ? {} : { released: true }),
        ...(args.bodyId !== 'all' ? { administrativeBodyId: args.bodyId } : {}),
        ...(dateTime ? { dateTime } : {}),
    };
}

function bodyIdOf(meeting: MeetingBody): string | null {
    return meeting.administrativeBody?.id ?? meeting.administrativeBodyId;
}

function bodyNameOf(meeting: MeetingBody): string {
    return meeting.administrativeBody?.name ?? '';
}

function electedOrderForBody(
    roles: { electedOrder: number | null; administrativeBodyId: string | null }[],
    bodyId: string | null,
): number | null {
    if (!bodyId) return null;
    return roles.find((role) => role.administrativeBodyId === bodyId)?.electedOrder ?? null;
}

function toResultCounts(row: {
    yayCount: number;
    nayCount: number;
    abstainCount: number;
    outcome: ResultCounts['outcome'];
    source: ResultCounts['source'];
    reviewStatus: ResultCounts['reviewStatus'];
} | null): ResultCounts | null {
    if (!row) return null;
    return {
        yayCount: row.yayCount,
        nayCount: row.nayCount,
        abstainCount: row.abstainCount,
        outcome: row.outcome,
        source: row.source,
        reviewStatus: row.reviewStatus,
    };
}

function toVotedSubject(
    row: {
        id: string;
        name: string;
        agendaItemIndex: number | null;
        voteResult: {
            yayCount: number;
            nayCount: number;
            abstainCount: number;
            outcome: ResultCounts['outcome'];
            source: ResultCounts['source'];
            reviewStatus: ResultCounts['reviewStatus'];
        } | null;
        votes: {
            voteType: RawVote['voteType'];
            source: RawVote['source'];
            reviewStatus: RawVote['reviewStatus'];
            person: {
                id: string;
                name: string;
                roles: { electedOrder: number | null; administrativeBodyId: string | null }[];
            };
        }[];
        councilMeeting: MeetingBody;
    },
    filterBodyId: string | 'all',
): VotedSubject {
    const meetingBodyId = bodyIdOf(row.councilMeeting);
    const orderBodyId = filterBodyId === 'all' ? meetingBodyId : filterBodyId;
    return {
        subjectId: row.id,
        subjectName: row.name,
        meetingId: row.councilMeeting.id,
        meetingDateTime: row.councilMeeting.dateTime,
        agendaItemIndex: row.agendaItemIndex,
        bodyId: meetingBodyId,
        bodyName: bodyNameOf(row.councilMeeting),
        result: toResultCounts(row.voteResult),
        votes: row.votes.map((vote) => ({
            personId: vote.person.id,
            personName: vote.person.name,
            electedOrder: electedOrderForBody(vote.person.roles, orderBodyId),
            voteType: vote.voteType,
            source: vote.source,
            reviewStatus: vote.reviewStatus,
        })),
    };
}

export async function loadVoteFeedData(args: {
    cityId: string;
    bodyId: string | 'all';
    from: Date | null;
    toExclusive: Date | null;
    includeUnreleased: boolean;
}): Promise<{
    voted: VotedSubject[];
    unvoted: UnvotedFeedSubject[];
    roster: { personId: string; name: string }[];
}> {
    const councilMeeting = meetingFilter(args);
    const roleWhere: Prisma.RoleWhereInput =
        args.bodyId === 'all'
            ? { administrativeBody: { cityId: args.cityId } }
            : { administrativeBodyId: args.bodyId };

    const votePersonSelect = {
        select: {
            id: true,
            name: true,
            roles: {
                select: { electedOrder: true, administrativeBodyId: true },
                where: {
                    electedOrder: { not: null },
                    ...(args.bodyId !== 'all' ? { administrativeBodyId: args.bodyId } : {}),
                },
            },
        },
    } satisfies Prisma.PersonDefaultArgs;

    const meetingSelect = {
        select: {
            id: true,
            dateTime: true,
            name: true,
            released: true,
            administrativeBodyId: true,
            administrativeBody: { select: { id: true, name: true } },
        },
    } satisfies Prisma.CouncilMeetingDefaultArgs;

    const [votedRows, unvotedRows, roleRows] = await Promise.all([
        prisma.subject.findMany({
            where: {
                cityId: args.cityId,
                councilMeeting,
                OR: [{ votes: { some: {} } }, { voteResult: { isNot: null } }],
            },
            take: VOTED_WINDOW_CAP + 1,
            select: {
                id: true,
                name: true,
                agendaItemIndex: true,
                voteResult: true,
                votes: {
                    select: {
                        voteType: true,
                        source: true,
                        reviewStatus: true,
                        person: votePersonSelect,
                    },
                },
                councilMeeting: meetingSelect,
            },
        }),
        prisma.subject.findMany({
            where: {
                cityId: args.cityId,
                councilMeeting,
                votes: { none: {} },
                voteResult: null,
                withdrawn: false,
            },
            select: {
                id: true,
                name: true,
                withdrawn: true,
                councilMeeting: meetingSelect,
            },
        }),
        prisma.role.findMany({
            where: roleWhere,
            select: {
                personId: true,
                startDate: true,
                endDate: true,
                person: { select: { name: true } },
            },
        }),
    ]);

    if (votedRows.length > VOTED_WINDOW_CAP) {
        throw new VoteWindowTooLarge();
    }

    const now = new Date();
    const rosterByPerson = new Map<string, string>();
    for (const role of roleRows) {
        if (!isRoleActiveAt(role, now)) continue;
        if (!rosterByPerson.has(role.personId)) {
            rosterByPerson.set(role.personId, role.person.name);
        }
    }

    const roster = [...rosterByPerson.entries()]
        .map(([personId, name]) => ({ personId, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        voted: votedRows.map((row) => toVotedSubject(row, args.bodyId)),
        unvoted: unvotedRows.map((row) => ({
            subjectId: row.id,
            subjectName: row.name,
            meetingId: row.councilMeeting.id,
            meetingDateTime: row.councilMeeting.dateTime,
            meetingName: row.councilMeeting.name,
            bodyId: bodyIdOf(row.councilMeeting),
            bodyName: bodyNameOf(row.councilMeeting),
            withdrawn: row.withdrawn,
        })),
        roster,
    };
}

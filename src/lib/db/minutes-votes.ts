import { ReviewStatus } from '@prisma/client';
import { NotFoundError } from '@/lib/api/errors';
import type { MinutesVotesBody } from '@/lib/zod-schemas/minutesVotes';
import prisma from './prisma';

type AttendanceInput = MinutesVotesBody['attendance'][number];
type ResultInput = MinutesVotesBody['results'][number];
type VoteInput = ResultInput['votes'][number];

export async function upsertMinutesVotes(
    cityId: string,
    meetingId: string,
    body: MinutesVotesBody,
) {
    const subjectIds = [...new Set(body.results.map((result) => result.subjectId))];
    if (subjectIds.length > 0) {
        const found = await prisma.subject.findMany({
            where: { cityId, councilMeetingId: meetingId, id: { in: subjectIds } },
            select: { id: true },
        });
        if (found.length !== subjectIds.length) {
            throw new NotFoundError('Subject not found in this meeting');
        }
    }

    const attendance = [];
    for (const row of body.attendance) {
        attendance.push(await upsertAttendance(cityId, meetingId, row));
    }

    const results = [];
    const votes = [];
    for (const result of body.results) {
        results.push(await upsertResult(result));
        for (const vote of result.votes) {
            votes.push(await upsertVote(result.subjectId, result.source, vote));
        }
    }

    return { attendance, results, votes };
}

async function upsertAttendance(cityId: string, meetingId: string, row: AttendanceInput) {
    const existing = await prisma.meetingAttendance.findUnique({
        where: {
            councilMeetingId_cityId_personId_source: {
                councilMeetingId: meetingId,
                cityId,
                personId: row.personId,
                source: row.source,
            },
        },
    });
    if (!existing) {
        return prisma.meetingAttendance.create({
            data: {
                cityId,
                councilMeetingId: meetingId,
                personId: row.personId,
                status: row.status,
                source: row.source,
            },
        });
    }
    return prisma.meetingAttendance.update({
        where: { id: existing.id },
        data: {
            status: row.status,
            reviewStatus: existing.status === row.status
                ? existing.reviewStatus
                : ReviewStatus.unreviewed,
        },
    });
}

async function upsertResult(result: ResultInput) {
    const existing = await prisma.subjectVoteResult.findUnique({
        where: { subjectId: result.subjectId },
    });
    const payload = {
        outcome: result.outcome,
        yayCount: result.yayCount,
        nayCount: result.nayCount,
        abstainCount: result.abstainCount,
        kind: result.kind,
        motionText: result.motionText ?? null,
        source: result.source,
    };
    if (!existing) {
        return prisma.subjectVoteResult.create({
            data: { subjectId: result.subjectId, ...payload },
        });
    }
    const countsUnchanged = existing.yayCount === result.yayCount
        && existing.nayCount === result.nayCount
        && existing.abstainCount === result.abstainCount;
    return prisma.subjectVoteResult.update({
        where: { id: existing.id },
        data: {
            ...payload,
            reviewStatus: countsUnchanged ? existing.reviewStatus : ReviewStatus.unreviewed,
        },
    });
}

async function upsertVote(subjectId: string, source: ResultInput['source'], vote: VoteInput) {
    const existing = await prisma.subjectVote.findUnique({
        where: {
            subjectId_personId_source: {
                subjectId,
                personId: vote.personId,
                source,
            },
        },
    });
    if (!existing) {
        return prisma.subjectVote.create({
            data: {
                subjectId,
                personId: vote.personId,
                voteType: vote.voteType,
                source,
            },
        });
    }
    return prisma.subjectVote.update({
        where: { id: existing.id },
        data: {
            voteType: vote.voteType,
            reviewStatus: existing.voteType === vote.voteType
                ? existing.reviewStatus
                : ReviewStatus.unreviewed,
        },
    });
}

export async function approveMeetingVotes(cityId: string, meetingId: string) {
    const whereSubject = { subject: { cityId, councilMeetingId: meetingId } };
    const [votes, attendance, results] = await Promise.all([
        prisma.subjectVote.updateMany({
            where: whereSubject,
            data: { reviewStatus: ReviewStatus.approved },
        }),
        prisma.meetingAttendance.updateMany({
            where: { cityId, councilMeetingId: meetingId },
            data: { reviewStatus: ReviewStatus.approved },
        }),
        prisma.subjectVoteResult.updateMany({
            where: whereSubject,
            data: { reviewStatus: ReviewStatus.approved },
        }),
    ]);
    return { votes: votes.count, attendance: attendance.count, results: results.count };
}

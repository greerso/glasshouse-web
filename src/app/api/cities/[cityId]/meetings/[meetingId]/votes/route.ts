import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser, withServiceOrUserAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/errors';
import { minutesVotesBodySchema, minutesVotesReviewSchema } from '@/lib/zod-schemas/minutesVotes';
import { approveMeetingVotes, upsertMinutesVotes } from '@/lib/db/minutes-votes';

function revalidateMeeting(cityId: string, meetingId: string) {
    revalidateTag(`city:${cityId}:meeting:${meetingId}`, 'max');
    revalidatePath(`/${cityId}/${meetingId}`, 'layout');
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ cityId: string; meetingId: string }> },
) {
    const params = await props.params;
    try {
        await withServiceOrUserAuth(request, { cityId: params.cityId });
        const body = minutesVotesBodySchema.parse(await request.json());
        const written = await upsertMinutesVotes(params.cityId, params.meetingId, body);
        revalidateMeeting(params.cityId, params.meetingId);
        return NextResponse.json(written);
    } catch (error) {
        return handleApiError(error, 'Failed to upsert votes');
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ cityId: string; meetingId: string }> },
) {
    const params = await props.params;
    try {
        const user = await getCurrentUser();
        if (!user?.isSuperAdmin) {
            return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
        }
        minutesVotesReviewSchema.parse(await request.json());
        const written = await approveMeetingVotes(params.cityId, params.meetingId);
        revalidateMeeting(params.cityId, params.meetingId);
        return NextResponse.json(written);
    } catch (error) {
        return handleApiError(error, 'Failed to approve votes');
    }
}

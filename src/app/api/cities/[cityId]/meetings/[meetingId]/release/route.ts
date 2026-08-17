import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withServiceOrUserAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/errors';
import { toggleMeetingReleaseDirect } from '@/lib/db/meetings';

const bodySchema = z.object({ released: z.boolean() });

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ cityId: string; meetingId: string }> },
) {
    const params = await props.params;
    try {
        await withServiceOrUserAuth(request, { cityId: params.cityId });
        const { released } = bodySchema.parse(await request.json());
        const meeting = await toggleMeetingReleaseDirect(params.cityId, params.meetingId, released);
        return NextResponse.json({ id: meeting.id, released: meeting.released });
    } catch (error) {
        return handleApiError(error, 'Failed to set meeting release');
    }
}

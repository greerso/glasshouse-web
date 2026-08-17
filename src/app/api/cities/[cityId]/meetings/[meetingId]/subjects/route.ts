import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withServiceOrUserAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/errors';
import { ingestSubjectsBodySchema } from '@/lib/zod-schemas/ingestSubject';
import { upsertIngestSubjects } from '@/lib/db/subjects-ingest';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ cityId: string; meetingId: string }> },
) {
    const params = await props.params;
    try {
        await withServiceOrUserAuth(request, { cityId: params.cityId });
        const body = ingestSubjectsBodySchema.parse(await request.json());
        const subjects = await upsertIngestSubjects(params.cityId, params.meetingId, body.subjects);
        revalidateTag(`city:${params.cityId}:meeting:${params.meetingId}`, 'max');
        revalidatePath(`/${params.cityId}/${params.meetingId}`, 'layout');
        return NextResponse.json({ subjects });
    } catch (error) {
        return handleApiError(error, 'Failed to upsert subjects');
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { withServiceOrUserAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/errors';
import { observationBodySchema } from '@/lib/zod-schemas/observation';
import { getObservations, upsertObservation } from '@/lib/db/observations';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ cityId: string }> },
) {
    const params = await props.params;
    try {
        await withServiceOrUserAuth(request, { cityId: params.cityId });
        const source = new URL(request.url).searchParams.get('source') ?? undefined;
        const rows = await getObservations(params.cityId, source);
        return NextResponse.json(rows);
    } catch (error) {
        return handleApiError(error, 'Failed to list observations');
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ cityId: string }> },
) {
    const params = await props.params;
    try {
        await withServiceOrUserAuth(request, { cityId: params.cityId });
        const body = observationBodySchema.parse(await request.json());
        const row = await upsertObservation({
            cityId: params.cityId,
            source: body.source,
            contentHash: body.contentHash,
            meetingId: body.meetingId,
            firstObservedAt: body.firstObservedAt ? new Date(body.firstObservedAt) : undefined,
        });
        return NextResponse.json(row);
    } catch (error) {
        return handleApiError(error, 'Failed to upsert observation');
    }
}

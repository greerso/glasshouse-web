import prisma from './prisma';

export async function getObservations(cityId: string, source?: string) {
    return prisma.agendaObservation.findMany({
        where: { cityId, ...(source ? { source } : {}) },
        orderBy: { firstObservedAt: 'asc' },
    });
}

export async function upsertObservation(input: {
    cityId: string;
    source: string;
    contentHash: string;
    meetingId?: string;
    firstObservedAt?: Date;
}) {
    const existing = await prisma.agendaObservation.findUnique({
        where: { cityId_source: { cityId: input.cityId, source: input.source } },
    });
    if (existing) {
        return prisma.agendaObservation.update({
            where: { id: existing.id },
            data: {
                contentHash: input.contentHash,
                meetingId: input.meetingId ?? existing.meetingId,
            },
        });
    }
    return prisma.agendaObservation.create({
        data: {
            cityId: input.cityId,
            source: input.source,
            contentHash: input.contentHash,
            meetingId: input.meetingId,
            firstObservedAt: input.firstObservedAt ?? new Date(),
        },
    });
}

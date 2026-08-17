import prisma from './prisma';

export type IngestSubjectInput = {
    name: string;
    description: string;
    agendaItemIndex: number;
    contextCitationUrls?: string[];
};

export async function upsertIngestSubjects(
    cityId: string,
    meetingId: string,
    subjects: IngestSubjectInput[],
) {
    const existing = await prisma.subject.findMany({
        where: { cityId, councilMeetingId: meetingId },
        select: { id: true, agendaItemIndex: true },
    });
    const byIndex = new Map<number, string>();
    for (const row of existing) {
        if (row.agendaItemIndex !== null) byIndex.set(row.agendaItemIndex, row.id);
    }

    const results = [];
    for (const subject of subjects) {
        const urls = subject.contextCitationUrls ?? [];
        const existingId = byIndex.get(subject.agendaItemIndex);
        if (existingId) {
            results.push(await prisma.subject.update({
                where: { id: existingId },
                data: {
                    name: subject.name,
                    description: subject.description,
                    contextCitationUrls: urls,
                },
            }));
        } else {
            results.push(await prisma.subject.create({
                data: {
                    name: subject.name,
                    description: subject.description,
                    agendaItemIndex: subject.agendaItemIndex,
                    cityId,
                    councilMeetingId: meetingId,
                    contextCitationUrls: urls,
                },
            }));
        }
    }
    return results;
}

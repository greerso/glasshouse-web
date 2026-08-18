import prisma from './prisma';

export type IngestSubjectInput = {
    name: string;
    description: string;
    agendaItemIndex?: number;
    nonAgendaReason?: 'outOfAgenda' | 'beforeAgenda';
    contextCitationUrls?: string[];
};

function nameReasonKey(name: string, reason: string) {
    return `${name}\0${reason}`;
}

export async function upsertIngestSubjects(
    cityId: string,
    meetingId: string,
    subjects: IngestSubjectInput[],
) {
    const existing = await prisma.subject.findMany({
        where: { cityId, councilMeetingId: meetingId },
        select: { id: true, agendaItemIndex: true, name: true, nonAgendaReason: true },
    });
    const byIndex = new Map<number, string>();
    const byNameReason = new Map<string, string>();
    for (const row of existing) {
        if (row.agendaItemIndex !== null) byIndex.set(row.agendaItemIndex, row.id);
        if (row.nonAgendaReason) byNameReason.set(nameReasonKey(row.name, row.nonAgendaReason), row.id);
    }

    const results = [];
    for (const subject of subjects) {
        const urls = subject.contextCitationUrls ?? [];
        if (subject.nonAgendaReason) {
            const key = nameReasonKey(subject.name, subject.nonAgendaReason);
            const existingId = byNameReason.get(key);
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
                const created = await prisma.subject.create({
                    data: {
                        name: subject.name,
                        description: subject.description,
                        agendaItemIndex: null,
                        nonAgendaReason: subject.nonAgendaReason,
                        cityId,
                        councilMeetingId: meetingId,
                        contextCitationUrls: urls,
                    },
                });
                byNameReason.set(key, created.id);
                results.push(created);
            }
            continue;
        }

        const existingId = subject.agendaItemIndex === undefined
            ? undefined
            : byIndex.get(subject.agendaItemIndex);
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
            const created = await prisma.subject.create({
                data: {
                    name: subject.name,
                    description: subject.description,
                    agendaItemIndex: subject.agendaItemIndex,
                    cityId,
                    councilMeetingId: meetingId,
                    contextCitationUrls: urls,
                },
            });
            if (subject.agendaItemIndex !== undefined) byIndex.set(subject.agendaItemIndex, created.id);
            results.push(created);
        }
    }
    return results;
}

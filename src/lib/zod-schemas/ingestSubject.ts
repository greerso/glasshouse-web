import { z } from 'zod';

const contextCitationUrls = z.array(z.string().url()).optional().default([]);

export const ingestAgendaSubjectSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    agendaItemIndex: z.number().int(),
    contextCitationUrls,
}).strict();

export const ingestOutOfAgendaSubjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional().default(''),
    nonAgendaReason: z.enum(['outOfAgenda', 'beforeAgenda']),
    contextCitationUrls,
}).strict();

export const ingestSubjectSchema = z.union([
    ingestAgendaSubjectSchema,
    ingestOutOfAgendaSubjectSchema,
]);

export const ingestSubjectsBodySchema = z.object({
    subjects: z.array(ingestSubjectSchema).min(1),
});

export type IngestSubject = z.infer<typeof ingestSubjectSchema>;

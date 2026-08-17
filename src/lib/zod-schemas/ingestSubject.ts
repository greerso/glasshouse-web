import { z } from 'zod';

export const ingestSubjectSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    agendaItemIndex: z.number().int(),
    contextCitationUrls: z.array(z.string().url()).optional().default([]),
});

export const ingestSubjectsBodySchema = z.object({
    subjects: z.array(ingestSubjectSchema).min(1),
});

export type IngestSubject = z.infer<typeof ingestSubjectSchema>;

import { z } from 'zod';

const civilDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const instant = z.string().datetime({ offset: true });

const officeSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    seats: z.number().int().positive(),
});

const candidateSchema = z.object({
    officeId: z.string().min(1),
    name: z.string().min(1),
    sourceUrl: z.string().url(),
    sourceDate: civilDate,
    status: z.enum(['qualified', 'withdrawn']),
});

export const electionFileSchema = z.object({
    cityId: z.string().min(1),
    electionDate: civilDate,
    title: z.string().min(1),
    offices: z.array(officeSchema).min(1),
    candidates: z.array(candidateSchema),
    dates: z.object({
        qualifyingClose: instant,
        withdrawalClose: instant,
        registrationDeadline: instant,
        earlyVoteStart: civilDate,
        earlyVoteEnd: civilDate,
        electionDay: civilDate,
    }),
    links: z.array(z.object({
        label: z.string().min(1),
        href: z.string().url(),
    })).min(1),
    sourceNote: z.string().min(1),
    lastCapturedAt: civilDate,
}).superRefine((val, ctx) => {
    const ids = new Set(val.offices.map((o) => o.id));
    val.candidates.forEach((c, i) => {
        if (!ids.has(c.officeId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `unknown officeId ${c.officeId}`,
                path: ['candidates', i, 'officeId'],
            });
        }
    });
});

export type ElectionFile = z.infer<typeof electionFileSchema>;

export function parseElectionFile(data: unknown): ElectionFile {
    return electionFileSchema.parse(data);
}

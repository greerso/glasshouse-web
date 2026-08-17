import { z } from 'zod';

export const observationBodySchema = z.object({
    source: z.string().min(1),
    contentHash: z.string().min(1),
    meetingId: z.string().min(1).optional(),
    firstObservedAt: z.string().datetime().optional(),
});

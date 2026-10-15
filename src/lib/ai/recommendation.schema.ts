import { z } from 'zod';
export const recommendationSchema=z.object({
 guard:z.enum(['bone','blue','tortoise','engraved']),
 body:z.enum(['bone','black']), hardware:z.enum(['chrome','brushed']),
 title:z.string(), rationale:z.string(),
}).strict();
export type Recommendation=z.infer<typeof recommendationSchema>;

import { describe, expect, it } from 'vitest';
import { recommendationSchema } from '@/lib/ai/recommendation.schema';
describe('RACKET recommendation validation',()=>{
 const valid={guard:'tortoise',body:'bone',hardware:'brushed',title:'Camden night',rationale:'Warm amber meets soft metal.'};
 it('accepts available materials',()=>expect(recommendationSchema.parse(valid)).toEqual(valid));
 it('rejects invented materials',()=>expect(recommendationSchema.safeParse({...valid,guard:'gold'}).success).toBe(false));
 it('requires the full pairing and rationale',()=>expect(recommendationSchema.safeParse({guard:'bone',body:'bone'}).success).toBe(false));
 it('rejects extra settings from the model',()=>expect(recommendationSchema.safeParse({...valid,price:999}).success).toBe(false));
});
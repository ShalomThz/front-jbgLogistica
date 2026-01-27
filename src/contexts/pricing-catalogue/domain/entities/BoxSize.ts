import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';

export const BoxSizeSchema = z.object({
  id: IdentifierSchema,
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  maxWeight: z.number().positive(),
});

export type BoxSize = z.infer<typeof BoxSizeSchema>;

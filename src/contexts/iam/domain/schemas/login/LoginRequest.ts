import { z } from 'zod';
import { emailSchema } from '@/shared/domain';

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export type LoginRequestPrimitives = z.infer<typeof loginRequestSchema>;

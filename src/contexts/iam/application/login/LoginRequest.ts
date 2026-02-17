import { z } from 'zod';
import { emailSchema } from '@contexts/shared/domain/schemas/Email';

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export type LoginRequestPrimitives = z.infer<typeof loginRequestSchema>;

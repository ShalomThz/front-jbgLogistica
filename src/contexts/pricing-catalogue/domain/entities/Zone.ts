import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';

export const ZoneSchema = z.object({
  id: IdentifierSchema,
  name: z.string().min(1, 'El nombre de zona es requerido'),
  assignedStores: z.array(IdentifierSchema),
});

export type Zone = z.infer<typeof ZoneSchema>;

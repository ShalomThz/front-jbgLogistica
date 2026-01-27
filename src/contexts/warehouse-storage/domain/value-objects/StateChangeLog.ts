import { z } from 'zod';

export const StorageStateSchema = z.enum(['RECEIVED', 'IN_TRANSIT', 'COMPLETED']);

export type StorageState = z.infer<typeof StorageStateSchema>;

export const StateChangeLogSchema = z.object({
  fromState: StorageStateSchema.nullable(),
  toState: StorageStateSchema,
  changedAt: z.coerce.date(),
  changedBy: z.string(),
  notes: z.string().optional(),
});

export type StateChangeLog = z.infer<typeof StateChangeLogSchema>;

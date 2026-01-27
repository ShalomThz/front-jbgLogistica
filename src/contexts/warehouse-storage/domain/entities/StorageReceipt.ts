import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';
import { StorageStateSchema, StateChangeLogSchema } from '../value-objects/StateChangeLog';

export const StorageReceiptSchema = z.object({
  id: IdentifierSchema,
  clientId: IdentifierSchema,
  photos: z.array(z.string().url()),
  description: z.string().min(1, 'Descripción es requerida'),
  currentState: StorageStateSchema,
  history: z.array(StateChangeLogSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type StorageReceipt = z.infer<typeof StorageReceiptSchema>;

export const CreateStorageReceiptSchema = z.object({
  clientId: IdentifierSchema,
  photos: z.array(z.string().url()).min(1, 'Al menos una foto es requerida'),
  description: z.string().min(1, 'Descripción es requerida'),
});

export type CreateStorageReceiptInput = z.infer<typeof CreateStorageReceiptSchema>;

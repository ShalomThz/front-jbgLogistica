import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';

export const StockItemSchema = z.object({
  id: IdentifierSchema,
  sku: z.string().min(1, 'SKU es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  quantity: z.number().int(), // Permite negativos según requerimientos
  storeId: IdentifierSchema,
  updatedAt: z.coerce.date(),
});

export type StockItem = z.infer<typeof StockItemSchema>;

export const StockMovementSchema = z.object({
  stockItemId: IdentifierSchema,
  quantity: z.number().int(),
  type: z.enum(['CONSUME', 'RESTOCK']),
  reason: z.string().optional(),
});

export type StockMovement = z.infer<typeof StockMovementSchema>;

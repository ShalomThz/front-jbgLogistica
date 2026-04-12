import { z } from "zod";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";

export const boxSaleItemSchema = z.object({
  boxId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  subtotal: moneySchema,
});

export const boxSaleSchema = z.object({
  id: z.string(),
  items: z.array(boxSaleItemSchema).min(1),
  totalAmount: moneySchema,
  storeId: z.string(),
  soldBy: z.string(),
  customerName: z.string().trim().min(1).optional(),
  ...aggregateRootSchema.shape,
});

export type BoxSaleItemPrimitives = z.infer<typeof boxSaleItemSchema>;
export type BoxSalePrimitives = z.infer<typeof boxSaleSchema>;

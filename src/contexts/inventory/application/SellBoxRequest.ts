import { z } from "zod";

export const sellBoxRequestSchema = z.object({
  items: z.array(z.object({
    boxId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  currency: z.string().length(3),
  customerName: z.string().trim().min(1).optional(),
  storeId: z.string(),
  soldBy: z.string(),
});

export type SellBoxRequestPrimitives = z.infer<typeof sellBoxRequestSchema>;

import { z } from 'zod';
import { moneySchema } from '@/shared/domain';
export const orderFinancialsSchema = z.object({
  totalPrice: moneySchema,
  isPaid: z.boolean(),
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;

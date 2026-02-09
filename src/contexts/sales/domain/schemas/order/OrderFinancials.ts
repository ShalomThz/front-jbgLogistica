import { z } from 'zod';
import { moneySchema } from '@/shared/domain';
import { costBreakdownSchema } from './CostBreakdown';

export const orderFinancialsSchema = z.object({
  totalPrice: moneySchema.nullable(),
  isPaid: z.boolean().default(false),
  costBreakdown: costBreakdownSchema,
});


export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;

import { z } from 'zod';
import { MoneySchema } from '@/shared/domain';

export const OrderFinancialsSchema = z.object({
  id: z.uuid(),
  totalPrice: MoneySchema,
  isPaid: z.boolean().default(false),
  paidAt: z.coerce.date().optional(),
});

export type OrderFinancials = z.infer<typeof OrderFinancialsSchema>;

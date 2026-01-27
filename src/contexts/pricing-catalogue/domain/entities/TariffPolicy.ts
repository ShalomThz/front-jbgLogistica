import { z } from 'zod';
import { IdentifierSchema, MoneySchema } from '@/shared/domain';

export const TariffPolicySchema = z.object({
  id: IdentifierSchema,
  zoneId: IdentifierSchema,
  countryCode: z.string().length(2, 'Código de país debe tener 2 caracteres'),
  boxSizeId: IdentifierSchema,
  price: MoneySchema,
});

export type TariffPolicy = z.infer<typeof TariffPolicySchema>;

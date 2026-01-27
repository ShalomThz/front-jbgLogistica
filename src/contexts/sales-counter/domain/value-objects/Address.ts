import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  colony: z.string().min(1, 'La colonia es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'El estado es requerido'),
  zipCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  country: z.string().default('México'),
  reference: z.string().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

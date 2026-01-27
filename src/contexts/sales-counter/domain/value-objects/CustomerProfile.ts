import { z } from 'zod';

export const CustomerProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  email: z.string().email('Email inválido').optional(),
});

export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

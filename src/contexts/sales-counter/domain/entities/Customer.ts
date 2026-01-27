import { z } from 'zod';
import { IdentifierSchema } from '@/shared/domain';

export const CustomerSchema = z.object({
  id: IdentifierSchema,
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  email: z.string().email('Email inválido').optional(),
  orderHistory: z.array(IdentifierSchema),
  createdAt: z.coerce.date(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  email: z.string().email('Email inválido').optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

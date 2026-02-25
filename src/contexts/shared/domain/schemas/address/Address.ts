import { z } from 'zod';
import { placeDetailsResponseSchema } from './PlaceDetailsResponse';

export const addressSchema = placeDetailsResponseSchema.extend({
  address1: z.string().min(1, "Calle y número es requerido"),
  city: z.string().min(1, "Ciudad es requerida"),
  province: z.string().min(1, "Estado es requerido"),
  zip: z.string().min(1, "Código postal es requerido"),
  country: z.string().min(1, "País es requerido"),
  reference: z.string().min(1, "Referencia es requerida").max(25, "Máximo 25 caracteres"),
});

export const createAddressSchema = addressSchema;

export type AddressPrimitives = z.infer<typeof addressSchema>;
export type CreateAddressPrimitives = z.infer<typeof createAddressSchema>;

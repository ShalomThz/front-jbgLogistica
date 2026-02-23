import { z } from 'zod';
import { placeDetailsResponseSchema } from './PlaceDetailsResponse';

export const addressSchema = placeDetailsResponseSchema.extend({
  reference: z.string().default(""),
});

export const createAddressSchema = addressSchema;

export type AddressPrimitives = z.infer<typeof addressSchema>;
export type CreateAddressPrimitives = z.infer<typeof createAddressSchema>;

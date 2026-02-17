import { z } from 'zod';
import { geolocationSchema } from './Geolocation';

export const addressSchema = z.object({
  address1: z.string().min(1, "Address is required"),
  address2: z.string().default(""),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  zip: z.string().min(1, "Zip code is required"),
  country: z.string().min(2).max(2),
  reference: z.string().default(""),
  geolocation: geolocationSchema,
});

export const createAddressSchema = addressSchema.omit({ geolocation: true });

export type AddressPrimitives = z.infer<typeof addressSchema>;
export type CreateAddressPrimitives = z.infer<typeof createAddressSchema>;

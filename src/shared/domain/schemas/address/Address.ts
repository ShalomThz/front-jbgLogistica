import { z } from 'zod';
import { geolocationSchema } from './Geolocation';
import { COUNTRIES } from './Country';

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const addressSchema = z.object({
  address1: z.string().min(1, "Address is required"),
  address2: z.string().default(""),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  zip: z.string().min(1, "Zip code is required"),
  country: z.enum(countryCodes),
  reference: z.string().default(""),
  geolocation: geolocationSchema,
});

export type AddressPrimitives = z.infer<typeof addressSchema>;

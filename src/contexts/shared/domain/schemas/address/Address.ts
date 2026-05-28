import { z } from 'zod';
import { geolocationSchema } from './Geolocation';
import { placeDetailsResponseSchema } from './PlaceDetailsResponse';

export const addressSchema = placeDetailsResponseSchema.extend({
  address1: z.string().min(1, "Calle y número es requerido"),
  city: z.string().min(1, "Ciudad es requerida"),
  province: z.string().min(1, "Estado es requerido"),
  zip: z.string(),
  country: z.string().min(1, "País es requerido"),
  reference: z.string().min(1, "Referencia es requerida").max(25, "Máximo 25 caracteres"),
});

export const responseAddressSchema = z.object({
  address1: z.string().optional().default(""),
  address2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  province: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),
  reference: z.string().optional().default(""),
  geolocation: geolocationSchema.optional().default({
    latitude: 0,
    longitude: 0,
    placeId: null,
  }),
});

export type ResponseAddressPrimitives = z.infer<typeof responseAddressSchema>;

export const createAddressSchema = addressSchema.superRefine((value, ctx) => {
  if (value.country === "MX" && !value.zip) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Código postal es requerido",
      path: ["zip"],
    });
  }
  if (value.country === "MX" && !value.address2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Colonia es requerida",
      path: ["address2"],
    });
  }
});

export const verifiedAddressSchema = createAddressSchema.superRefine((value, ctx) => {
  const { placeId, latitude, longitude } = value.geolocation;
  const isVerified = !!placeId && (latitude !== 0 || longitude !== 0);
  if (!isVerified) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecciona una sugerencia de Google para verificar la dirección",
      path: ["geolocation"],
    });
  }
});

export type AddressPrimitives = z.infer<typeof addressSchema>;
export type CreateAddressPrimitives = z.infer<typeof createAddressSchema>;

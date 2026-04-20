import { z } from 'zod';
import { placeDetailsResponseSchema } from './PlaceDetailsResponse';

// Schema permisivo para parsear datos que vienen del API (datos existentes en BD)
export const addressSchema = placeDetailsResponseSchema.extend({
  address1: z.string(),
  address2: z.string().optional().or(z.literal("")),
  city: z.string(),
  province: z.string(),
  zip: z.string(),
  country: z.string(),
  reference: z.string(),
});

// Schema estricto solo para validar el formulario de crear/editar
export const createAddressSchema = placeDetailsResponseSchema.extend({
  address1: z.string().min(1, "Calle y número es requerido").trim().min(1, "Calle y número no puede ser solo espacios").max(150, "Máximo 150 caracteres"),
  address2: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  city: z.string().min(1, "Ciudad es requerida").trim().min(1, "Ciudad no puede ser solo espacios").max(100, "Máximo 100 caracteres"),
  province: z.string().min(1, "Estado es requerido").trim().min(1, "Estado no puede ser solo espacios").max(100, "Máximo 100 caracteres"),
  zip: z.string().min(1, "Código postal es requerido").regex(/^[A-Z0-9]{3,10}$/i, "Código postal inválido"),
  country: z.string().min(1, "País es requerido").trim().min(1, "País no puede ser solo espacios").max(100, "Máximo 100 caracteres"),
  reference: z.string().min(1, "Referencia es requerida").trim().min(1, "Referencia no puede ser solo espacios").max(25, "Máximo 25 caracteres"),
});

export type AddressPrimitives = z.infer<typeof addressSchema>;
export type CreateAddressPrimitives = z.infer<typeof createAddressSchema>;

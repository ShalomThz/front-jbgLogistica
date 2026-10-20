import z from "zod";
import { verifiedAddressSchema } from "../../../shared/domain/schemas/address/Address";
import { hqSkydropxBaseSchema } from "./HQSkydropxAddressBase";

export const saveSkydropxAddressItemSchema = hqSkydropxBaseSchema.extend({
  // El nombre de la bodega viaja como remitente en la guía de Skydropx, que
  // rechaza más de 30 caracteres. Solo al guardar: la respuesta usa el esquema
  // base, y una bodega ya guardada con un nombre largo se tiene que poder leer
  // para corregirla.
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Máximo 30 caracteres (límite de la paquetería)"),
  address: verifiedAddressSchema,
  isSelected: z.boolean(),
});

export const saveSkydropxAddressesSchema = z
  .object({
    skydropxAddresses: z.array(saveSkydropxAddressItemSchema),
  })
  .refine((data) => data.skydropxAddresses.some((a) => a.isSelected), {
    message: "Al menos una dirección debe estar seleccionada",
    path: ["skydropxAddresses"],
  })
  .refine(
    (data) => data.skydropxAddresses.filter((a) => a.isSelected).length <= 1,
    {
      message: "Solo una dirección puede estar seleccionada",
      path: ["skydropxAddresses"],
    },
  );

export type SaveSkydropxAddressItem = z.infer<typeof saveSkydropxAddressItemSchema>;
export type SaveSkydropxAddressesRequest = z.infer<typeof saveSkydropxAddressesSchema>;

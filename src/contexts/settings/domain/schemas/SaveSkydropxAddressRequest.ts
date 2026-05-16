import z from "zod";
import { verifiedAddressSchema } from "../../../shared/domain/schemas/address/Address";
import { hqSkydropxBaseSchema } from "./HQSkydropxAddressBase";

export const saveSkydropxAddressItemSchema = hqSkydropxBaseSchema.extend({
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

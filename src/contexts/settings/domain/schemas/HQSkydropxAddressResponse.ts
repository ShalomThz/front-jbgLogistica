import z from "zod";
import { responseAddressSchema } from "../../../shared/domain/schemas/address/Address";
import { hqSkydropxBaseSchema } from "./HQSkydropxAddressBase";

export const hqSkydropxAddressItemResponseSchema = hqSkydropxBaseSchema.extend({
  address: responseAddressSchema,
  isSelected: z.boolean(),
});

export const hqSkydropxAddressesResponseSchema = z.object({
  skydropxAddresses: z.array(hqSkydropxAddressItemResponseSchema),
});

export type HQSkydropxAddressItemResponse = z.infer<
  typeof hqSkydropxAddressItemResponseSchema
>;

export type HQSkydropxAddressesResponse = z.infer<
  typeof hqSkydropxAddressesResponseSchema
>;

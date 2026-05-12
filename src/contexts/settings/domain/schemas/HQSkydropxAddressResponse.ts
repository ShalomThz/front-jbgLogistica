import z from "zod";
import { addressSchema } from "../../../shared/domain/schemas/address/Address";
import { hqSkydropxBaseSchema } from "./HQSkydropxAddressBase";

export const hqSkydropxAddressResponseSchema = hqSkydropxBaseSchema.extend({
  address: addressSchema.safeExtend({
    reference: z.string(),
  }),
});

export type HQSkydropxAddressResponse = z.infer<
  typeof hqSkydropxAddressResponseSchema
>;

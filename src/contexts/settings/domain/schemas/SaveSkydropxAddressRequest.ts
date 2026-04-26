import z from "zod";
import { verifiedAddressSchema } from "../../../shared/domain/schemas/address/Address";
import { hqSkydropxBaseSchema } from "./HQSkydropxAddressBase";

export const saveSkydropxAddressSchema = hqSkydropxBaseSchema.extend({
  address: verifiedAddressSchema,
});

export type SaveSkydropxAddressRequest = z.infer<
  typeof saveSkydropxAddressSchema
>;

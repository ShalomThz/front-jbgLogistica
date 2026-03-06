import z from "zod";
import { addressSchema } from "../../../shared/domain/schemas/address/Address";
import { emailSchema } from "../../../shared/domain/schemas/Email";

export const hqSkydropxAddressSchema = z.object({
  address: addressSchema,
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: emailSchema,
  phone: z.string().min(1, "Phone is required"),
});

export type HQSkydropxAddressPrimitives = z.infer<
  typeof hqSkydropxAddressSchema
>;

export const hqSettingsSchema = z.object({
  skydropxAddress: hqSkydropxAddressSchema,
});

export type HQSettingsPrimitives = z.infer<typeof hqSettingsSchema>;

export const saveSkydropxAddressSchema = hqSkydropxAddressSchema;

export type SaveSkydropxAddressRequest = z.infer<
  typeof saveSkydropxAddressSchema
>;

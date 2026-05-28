import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const storeResponseSchema = storeSchema.extend({
  address: responseAddressSchema,
});

export type StoreResponsePrimitives = z.infer<typeof storeResponseSchema>;

export const storeListViewResponseSchema = storeResponseSchema
  .omit({ zoneId: true })
  .extend({ zone: zoneSchema });

export type StoreListViewResponsePrimitives = z.infer<
  typeof storeListViewResponseSchema
>;

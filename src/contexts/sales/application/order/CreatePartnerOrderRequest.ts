import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

const partnerCreatePackageSchema = packageSchema.partial({ weight: true });

export const createPartnerOrderSchema = z.object({
  storeId: z.string(),
  partnerOrderNumber: z.string(),
  package: partnerCreatePackageSchema,
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  costBreakdown: costBreakdownSchema.optional(),
});

export type CreatePartnerOrderRequest = z.infer<
  typeof createPartnerOrderSchema
>;

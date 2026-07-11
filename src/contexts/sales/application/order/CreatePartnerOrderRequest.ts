import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

const partnerCreatePackageSchema = packageSchema.partial({ weight: true });

export const createPartnerOrderSchema = z.object({
  storeId: z.string(),
  partnerOrderNumber: z.string().optional().default(""),
  package: partnerCreatePackageSchema,
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  tariff: moneySchema,
  costBreakdown: costBreakdownSchema.optional(),
  emptyBoxDelivery: z.boolean().optional(),
  /** "Recolección a domicilio": el chofer recoge la caja ya empacada del
   * remitente. Excluyente con emptyBoxDelivery. */
  homePickup: z.boolean().optional(),
  /** Requerido cuando emptyBoxDelivery: anticipo cobrado al crear. */
  advance: moneySchema.optional(),
  customerSignature: z.string().nullable(),
});

export type CreatePartnerOrderRequest = z.infer<
  typeof createPartnerOrderSchema
>;

import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { discountSchema } from "@contexts/sales/domain/schemas/value-objects/Discount";
import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const editOrderRequestSchema = z.object({
  storeId: z.string().optional(),
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  references: orderReferencesSchema.partial().optional(),
  package: packageSchema.optional(),
  emptyBoxDelivery: z.boolean().optional(),
  homePickup: z.boolean().optional(),
  customerSignature: z.string().nullish(),
  markAsPaid: z.boolean().nullish(),
  /** El backend lo exige cuando markAsPaid es true. */
  paymentMethod: z.enum(PAYMENT_METHODS).nullish(),
  paymentConcept: z.string().nullish(),
  discount: discountSchema.optional(),
  /** El monto que el socio le cobra a su cliente. Solo el total: el libro de
   * abonos se mueve por `/order/:id/partner-sale/payment`. Omitirlo deja lo que
   * había; `null` borra la venta. */
  partnerSaleTotal: moneySchema.nullish(),
  /** Los extras que el socio le suma a su cliente. Sin la clave declarada acá,
   * `.parse()` la descartaba en silencio y nunca llegaba a la API. */
  partnerSaleCostBreakdown: costBreakdownSchema.optional(),
  /** El descuento del socio a su cliente. Distinto de `discount`, que es el que
   * JBG le hace a él. Sin declararla, `.parse()` la borra en silencio. */
  partnerSaleDiscount: discountSchema.optional(),
});

export type EditOrderRequest = z.infer<typeof editOrderRequestSchema>;

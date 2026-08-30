import { serviceLevels } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
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
  /** Lo que se le cobra al socio: la sugerencia de la tabla o un monto escrito
   * a mano. */
  tariff: moneySchema,
  /** Lo que el socio le cobra a su propio cliente, con lo que ese cliente ya le
   * pagó. Opcional: sin esto la orden se crea igual y solo queda sin factura de
   * socio. Los ids y las fechas de los abonos los pone el servidor. */
  partnerSale: z
    .object({
      total: moneySchema,
      payments: z
        .array(
          z.object({
            amount: moneySchema,
            method: z.enum(PAYMENT_METHODS),
            concept: z.string().nullish(),
          }),
        )
        .default([]),
    })
    .nullish(),
  /** Velocidad contratada. Es el único insumo del precio que no se deriva: el
   * punto de recolección es la tienda socia y el peldaño es PARTNER por ser
   * orden de socio. */
  serviceLevel: z.enum(serviceLevels).optional(),
  costBreakdown: costBreakdownSchema.optional(),
  emptyBoxDelivery: z.boolean().optional(),
  /** "Recolección a domicilio": el chofer recoge la caja ya empacada del
   * remitente. Excluyente con emptyBoxDelivery. */
  homePickup: z.boolean().optional(),
  /** Abonos cobrados al crear la orden (se siembran en el libro). Requerido
   * ≥1 cuando emptyBoxDelivery. */
  payments: z
    .array(
      z.object({
        amount: moneySchema,
        method: z.enum(PAYMENT_METHODS),
        concept: z.string().nullish(),
      }),
    )
    .default([]),
  customerSignature: z.string().nullable(),
});

export type CreatePartnerOrderRequest = z.infer<
  typeof createPartnerOrderSchema
>;

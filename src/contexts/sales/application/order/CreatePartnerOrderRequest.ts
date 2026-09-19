import {
  serviceLevels,
  shippingModes,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { discountSchema } from "@contexts/sales/domain/schemas/value-objects/Discount";
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
      /** El cargo **base**: el servicio, sin los extras. */
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
      /** Los extras que el socio le suma a su cliente. Sin la clave declarada
       * acá, `.parse()` la descartaba en silencio y nunca llegaba a la API. */
      costBreakdown: costBreakdownSchema.optional(),
      /** El descuento del socio a su cliente. Mismo cuidado que arriba. */
      discount: discountSchema.optional(),
    })
    .nullish(),
  /**
   * Los tres insumos del precio que no se derivan. El punto de recolección es
   * la tienda socia y el peldaño es PARTNER por ser orden de socio; éstos los
   * elige quien cotiza.
   *
   * `shippingMode` y `destinationCountry` **faltaban acá**. El builder los
   * mandaba, este `.parse()` los descartaba en silencio, y el backend —que
   * exige los tres para cotizar— devolvía `null`: toda orden de socio se creaba
   * sin sugerencia de precio y nada lo avisaba.
   */
  serviceLevel: z.enum(serviceLevels).optional(),
  shippingMode: z.enum(shippingModes).optional(),
  destinationCountry: z.string().optional(),
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
  /** La nota de la factura. Espejo del back: si faltara acá, `.parse()` la
   * borraría en silencio. */
  notes: z.string().nullish(),
});

export type CreatePartnerOrderRequest = z.infer<
  typeof createPartnerOrderSchema
>;

import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { customerProfileSchema } from "../value-objects/CustomerProfile";
import { orderFinancialsSchema } from "../value-objects/OrderFinancials";
import { orderReferencesSchema } from "../value-objects/OrderReferences";
import { packageSchema } from "../value-objects/Package";
import { orderStatuses } from "./OrderStatuses";
import { orderTypes } from "./OrderTypes";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import {
  priceTypes,
  serviceLevels,
  shippingModes,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import z from "zod";

/**
 * Lo que la tabla de tarifas sugirió, y con qué factores. El precio que se
 * cobra es `financials.tariff`: esto es la otra mitad del par.
 *
 * En una orden partner continuada por HQ es el registro de con qué datos la
 * tomó la tienda socia.
 */
export const orderPricingSchema = z.object({
  price: moneySchema,
  zoneId: z.string(),
  destinationCountry: z
    .string()
    .nullish()
    .transform((v) => v ?? "MX"),
  tariffId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  // Las sugerencias anteriores al campo se leen como terrestre.
  shippingMode: z
    .enum(shippingModes)
    .nullish()
    .transform((v) => v ?? "GROUND"),
  priceType: z.enum(priceTypes),
  resolvedFrom: z.enum(["PARTNER_STORE", "COUNTER_DROPOFF", "PUBLIC_ADDRESS"]),
  quotedAt: z.string(),
});

export type OrderPricingPrimitives = z.infer<typeof orderPricingSchema>;

export const orderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  createdBy: z.string(),
  origin: customerProfileSchema,
  destination: customerProfileSchema,
  financials: orderFinancialsSchema,
  references: orderReferencesSchema,
  status: z.enum(orderStatuses),
  package: packageSchema,
  type: z.enum(orderTypes),
  /** "Dejar caja vacía a domicilio": caja entregada al remitente con anticipo
   * cobrado, recolectada y almacenada antes del proceso HQ. */
  emptyBoxDelivery: z.boolean().default(false),
  /** "Recolección a domicilio": el chofer recoge directamente la caja ya
   * empacada del remitente, sin dejar caja vacía antes. Excluyente con
   * emptyBoxDelivery. */
  homePickup: z.boolean().default(false),
  customerSignature: z.string().nullish(),
  /** Null en órdenes anteriores al campo, o cuando el precio se puso a mano
   * sin que hubiera tarifa para la combinación. */
  pricing: orderPricingSchema.nullish().transform((v) => v ?? null),
  ...aggregateRootSchema.shape,
});

export type OrderType = z.infer<typeof orderSchema.shape.type>;
export type OrderStatus = z.infer<typeof orderSchema.shape.status>;
export type OrderPrimitives = z.infer<typeof orderSchema>;

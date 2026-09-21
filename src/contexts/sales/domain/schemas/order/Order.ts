import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { customerProfileSchema } from "../value-objects/CustomerProfile";
import { orderFinancialsSchema } from "../value-objects/OrderFinancials";
import { orderReferencesSchema } from "../value-objects/OrderReferences";
import { packageSchema } from "../value-objects/Package";
import { orderStatuses } from "./OrderStatuses";
import { orderTypes } from "./OrderTypes";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { weightSchema } from "@contexts/shared/domain/schemas/Weight";
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
  destinationCountry: z.string(),
  tariffId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  shippingMode: z.enum(shippingModes),
  priceType: z.enum(priceTypes),
  resolvedFrom: z.enum(["PARTNER_STORE", "COUNTER_DROPOFF", "PUBLIC_ADDRESS"]),
  quotedAt: z.string(),
  /** `FLAT` es el total de una caja; `PER_WEIGHT`, peso facturable por precio
   * unitario. Con default: las fotos anteriores al campo son todas planas. */
  source: z.enum(["FLAT", "PER_WEIGHT"]).default("FLAT"),
  /**
   * Cómo se llegó al monto cuando se cobró por peso. `null` en las planas.
   *
   * Se guarda en la orden porque **no se puede reconstruir**: el peso
   * facturable depende del divisor volumétrico, que es un ajuste global y
   * puede cambiar. Recalcular una orden vieja con el divisor de hoy da otro
   * número.
   */
  weight: z
    .object({
      realWeight: weightSchema,
      volumetricWeight: weightSchema,
      billableWeight: weightSchema,
      pricePerUnit: moneySchema,
      volumetricDivisor: z.object({
        value: z.number(),
        basis: z.enum(["in3/lb", "cm3/kg"]),
      }),
    })
    .nullish()
    .default(null),
});

export type OrderPricingPrimitives = z.infer<typeof orderPricingSchema>;

export const orderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  createdBy: z.string(),
  origin: customerProfileSchema,
  destination: customerProfileSchema,
  /** El `.prefault({})` cubre la orden guardada sin la clave: se lee como cuenta
   * vacía, que es lo que significa. Ver {@link orderFinancialsSchema}. */
  financials: orderFinancialsSchema.prefault({}),
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
  /** La nota que se imprime en la factura. `nullish` y no `nullable`: las
   * órdenes anteriores al campo no traen la clave, y `/order/find` parsea la
   * página entera de una — exigirla dejaría la pantalla en blanco. */
  notes: z.string().nullish(),
  /** Null en órdenes anteriores al campo, o cuando el precio se puso a mano
   * sin que hubiera tarifa para la combinación.
   *
   * El `.catch(null)` no es adorno: `orderRepository` parsea la respuesta de
   * `/order/find` **entera** y lanza, así que las 50 órdenes de la página viajan
   * en un solo `parse`. Sin esto, una sola foto vieja —guardada antes de que
   * `destinationCountry` y `shippingMode` fueran obligatorios— dejaría la
   * pantalla de órdenes en blanco en vez de perder una foto de diagnóstico.
   * Es la misma regla que aplica el backend en `OrderPricing.fromPrimitives`. */
  pricing: orderPricingSchema
    .nullish()
    .transform((v) => v ?? null)
    .catch(null),
  ...aggregateRootSchema.shape,
});

export type OrderType = z.infer<typeof orderSchema.shape.type>;
export type OrderStatus = z.infer<typeof orderSchema.shape.status>;
export type OrderPrimitives = z.infer<typeof orderSchema>;

import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { PAYMENT_STATUSES } from "@contexts/shared/domain/schemas/PaymentStatus";
import { costBreakdownSchema } from "./CostBreakdown";
import { discountSchema } from "./Discount";
import z from "zod";

/** Un abono registrado contra la orden. El monto puede estar en cualquier
 * moneda; el backend deriva el paymentStatus convirtiéndolo al de facturación. */
export const paymentSchema = z.object({
  id: z.string(),
  amount: moneySchema,
  method: z.enum(PAYMENT_METHODS),
  concept: z.string().nullable().default(null),
  /** Marca de tiempo ISO en que se registró el abono. */
  date: z.string(),
  externalReference: z
    .object({
      provider: z.literal("CLOVER"),
      paymentId: z.string(),
      checkoutSessionId: z.string(),
    })
    .nullable()
    .default(null),
});

export type PaymentPrimitives = z.infer<typeof paymentSchema>;

/**
 * Cada clave defaultea, igual que en el back: un `financials` incompleto se lee
 * como cuenta vacía —o sea, un DRAFT— en vez de tumbar la orden.
 *
 * Acá importa más que en el back: `orderRepository` parsea la respuesta de
 * `/order/find` **entera**, las 50 órdenes en un solo `.parse()`. Sin los
 * defaults, un documento viejo al que le falte una clave no deja un hueco en la
 * tabla: deja la pantalla de órdenes en blanco. Es el mismo criterio que ya
 * aplica el `.catch(null)` de `pricing`.
 */
export const orderFinancialsSchema = z.object({
  tariff: moneySchema.nullable().default(null),
  totalPrice: moneySchema.nullable().default(null),
  totalBilled: moneySchema.nullable().default(null),
  /** Derivado de paymentStatus (=== "PAID"); se conserva por compatibilidad. */
  isPaid: z.boolean().default(false),
  /** Progreso del pago; derivado de los abonos vs. totalBilled. */
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  /** Método con el que se liquidó; null hasta que se marca pagada. */
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().default(null),
  /** Nota libre del pago (p. ej. referencia de la transferencia). */
  paymentConcept: z.string().nullable().default(null),
  /** Libro de abonos parciales. Vacío para órdenes previas al campo o
   * liquidadas por el flujo antiguo de pago único. */
  payments: z.array(paymentSchema).default([]),
  // `.prefault` y no `.default`: en zod 4 el default toma el tipo de salida, y
  // acá lo que se quiere es hacer pasar un `{}` por el schema para que actúen
  // los defaults de adentro.
  costBreakdown: costBreakdownSchema.prefault({}),
  discount: discountSchema.prefault({}),
  /** Lo que el socio le vendió el servicio a su propio cliente, con lo que ese
   * cliente ya le pagó **a él**. No es plata de JBG: no entra en `totalBilled`
   * ni en el estado de pago, y existe para la factura que el socio le entrega a
   * su cliente. `null` en órdenes HQ y en las de socio anteriores al campo.
   *
   * `payments` y `costBreakdown` son `.default(...)` porque las ventas guardadas
   * antes de cada uno no traen la clave. */
  partnerSale: z
    .object({
      /** El cargo **base**: el servicio, sin los extras. Lo que el cliente debe
       * es esto más `costBreakdown`, y así lo calcula el back. */
      total: moneySchema,
      payments: z.array(paymentSchema.omit({ externalReference: true })).default([]),
      /** Los extras que el socio le suma a su cliente. Misma forma que el
       * desglose de JBG, otra plata: aquél es lo que JBG le cobra a él. */
      costBreakdown: costBreakdownSchema.nullish(),
      /** Lo que el socio le rebaja a su cliente. No es el de JBG: aquél se lo
       * hizo JBG **a él** y vive en `discount`, un nivel más arriba. */
      discount: discountSchema.nullish(),
    })
    .nullish(),
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;

export type PartnerSalePrimitives = NonNullable<
  OrderFinancialsPrimitives["partnerSale"]
>;

/**
 * Lo que el cliente del socio le debe: el servicio más los extras menos el
 * descuento.
 *
 * Espeja al getter `billed` de `PartnerSale` en el back, que es contra el que se
 * derivan el saldo y el estado de la venta. Vive acá, y no repetido en cada
 * card, porque tres vistas lo necesitan —el detalle, su diálogo de abonos y la
 * pantalla de éxito— y si cada una lo calculara por su cuenta terminarían
 * mostrando saldos distintos de la misma orden.
 *
 * El `?? 0` en cadena cubre las ventas guardadas antes de cada campo: no traen
 * la clave, y ahí lo facturado es la base sola. Con piso en cero, igual que el
 * dominio: un descuento mayor que la cuenta no da un total negativo.
 */
export const partnerSaleBilled = (partnerSale: PartnerSalePrimitives): number => {
  const costs = partnerSale.costBreakdown;
  const extras =
    (costs?.insurance?.amount ?? 0) +
    (costs?.tools?.amount ?? 0) +
    (costs?.additionalCost?.amount ?? 0) +
    (costs?.wrap?.amount ?? 0) +
    (costs?.tape?.amount ?? 0);
  const discount = partnerSale.discount?.amount?.amount ?? 0;

  return Math.max(0, partnerSale.total.amount + extras - discount);
};

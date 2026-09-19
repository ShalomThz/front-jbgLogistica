import { weightUnits } from "@contexts/shared/domain/schemas/Weight";
import { z } from "zod";
import {
  baseOrderFormSchema,
  basePackageSchema,
  costBreakdownSchema,
} from "./BaseOrderForm";

// --- Partner form ---

/**
 * El paquete del socio: el base más el peso, **opcional**.
 *
 * Opcional y no obligatorio como en HQ porque no toda tienda socia tiene
 * balanza. De esa opcionalidad sale sola una regla que no hay que escribir en
 * ningún lado: los servicios que cobran por peso —hoy el aéreo— aparecen en la
 * cotización solo si se pesó. Sin peso, el socio ve lo de siempre.
 *
 * Las dimensiones ya salen de la caja elegida, así que el peso es lo único que
 * falta para poder cotizar por peso.
 */
const partnerPackageSchema = basePackageSchema.extend({
  /** Vacío es "no se pesó". Si se llena tiene que ser mayor a cero: un cero es
   * un peso declarado, y cobraría distinto que no haber pesado. */
  weight: z
    .string()
    .refine(
      (v) => v.trim() === "" || parseFloat(v) > 0,
      "El peso debe ser mayor a 0",
    ),
  weightUnit: z.enum(weightUnits),
});

// El anticipo de caja vacía ya no vive en el form: se captura como abono en el
// paso de precios y se valida al enviar (usePartnerOrderSubmission).
export const partnerOrderFormSchema = baseOrderFormSchema.extend({
  orderType: z.literal("PARTNER"),
  package: partnerPackageSchema,
  /**
   * Lo que el socio le cobra a su propio cliente.
   *
   * Va acá y no en el formulario base porque en una orden HQ no hay tercero que
   * revenda. Monto y moneda juntos, como `shippingService.discount`: el importe
   * es texto —igual que el resto de los montos del formulario— y se convierte al
   * armar el request.
   *
   * La moneda es **propia** y elegible. Antes se heredaba de tres lugares
   * distintos —la tarifa al crear, la de visualización al editar, y una tercera
   * para los abonos—; cuando no coincidían, `PartnerSale`, que exige una sola,
   * rechazaba la orden y no había forma de corregirlo desde la pantalla. Y el
   * socio puede cobrarle a su cliente en otra moneda que la que JBG le factura
   * a él.
   */
  partnerSale: z.object({
    /** El cargo **base**: el servicio, sin los extras. Lo que el cliente debe es
     * base + desglose, y ese total se muestra calculado. */
    amount: z.string(),
    currency: z.string(),
    /** Los extras que el socio le suma a su cliente. Comparte forma con el
     * desglose de JBG a propósito: los renglones quedan enfrentados y el socio
     * puede comparar lo que le cobran contra lo que cobra. Una sola moneda para
     * todo, la de `currency`: el dominio rechaza la mezcla. */
    costBreakdown: costBreakdownSchema,
    /** Lo que el socio le rebaja a su cliente. Con concepto, igual que el de
     * JBG: un descuento sin motivo escrito no se puede explicar después. En la
     * moneda de la venta, como todo lo demás de este objeto. */
    discount: z.object({
      amount: z.string(),
      concept: z.string(),
    }),
  }),
});

export type PartnerOrderFormValues = z.infer<typeof partnerOrderFormSchema>;
export type PartnerPackageFormData = PartnerOrderFormValues["package"];

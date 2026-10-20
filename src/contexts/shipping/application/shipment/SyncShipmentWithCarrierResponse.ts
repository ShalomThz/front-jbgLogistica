import { shipmentResponseSchema } from "@contexts/shipping/application/shipment/ShipmentResponse";
import { z } from "zod";

/**
 * Qué pasó al poner el envío al día con la paquetería
 * (`POST /shipment/:id/sync-carrier`), para cuando su webhook no llegó:
 *
 * - `fulfilled`: la guía que se estaba creando ya estaba lista.
 * - `pending`: la sigue creando; no cambió nada.
 * - `failed`: no pudo crearla; `reason` dice por qué.
 * - `updated`: traía un estado nuevo del paquete.
 * - `cancelled`: la paquetería lo tiene cancelado; aquí también se canceló.
 * - `unchanged`: lo que dice la paquetería ya estaba reflejado.
 * - `not_carrier`: no lo lleva una paquetería; no hay a quién preguntar.
 */
export const syncShipmentWithCarrierResponseSchema = z.object({
  outcome: z.enum([
    "fulfilled",
    "pending",
    "failed",
    "updated",
    "cancelled",
    "unchanged",
    "not_carrier",
  ]),
  reason: z.string().nullable(),
  shipment: shipmentResponseSchema,
});

export type SyncShipmentWithCarrierResponse = z.infer<
  typeof syncShipmentWithCarrierResponseSchema
>;

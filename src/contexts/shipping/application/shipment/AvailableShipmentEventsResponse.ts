import { shipmentStages } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { shipmentStatuses } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { z } from "zod";

const evidenceRequirements = ["required", "optional", "none"] as const;

export type EvidenceRequirement = (typeof evidenceRequirements)[number];

/**
 * Un evento que se puede registrar sobre el envío tal como está. Lo calcula el
 * back con la misma regla con la que valida, así que el front no guarda una
 * copia del catálogo: muestra lo que viene.
 */
export const availableShipmentEventSchema = z.object({
  code: z.string(),
  stage: z.enum(shipmentStages),
  label: z.string(),
  photo: z.enum(evidenceRequirements),
  signature: z.enum(evidenceRequirements),
  requiresLocation: z.boolean(),
  requiresRecipient: z.boolean(),
  /** El estatus operativo al que lleva, o null si no lo mueve. Si lo mueve,
   * las observaciones son obligatorias. */
  movesTo: z.enum(shipmentStatuses).nullable(),
  /** Ya se registró sobre este envío. */
  recorded: z.boolean(),
  /** Es el que sigue en su etapa según el orden de la guía: el diálogo lo
   * preselecciona, pero se puede elegir cualquier otro. */
  suggested: z.boolean(),
  /** Por qué no se puede registrar ahora, o null si se puede. Llega igual para
   * mostrarlo deshabilitado con el motivo en vez de esconderlo. */
  blocked: z.enum(["SALE_PENDING", "SALE_COMPLETED"]).nullable(),
});

/** El aviso de un evento bloqueado por la venta. */
export const BLOCKED_REASON: Record<
  NonNullable<z.infer<typeof availableShipmentEventSchema>["blocked"]>,
  string
> = {
  SALE_PENDING: "Primero se debe completar la venta",
  SALE_COMPLETED: "Se registra antes de completar la venta",
};

export type AvailableShipmentEvent = z.infer<
  typeof availableShipmentEventSchema
>;

const stageLockReasons = [
  "ARRIVAL_PENDING",
  "SALE_PENDING",
  "LABEL_PENDING",
  "ROUTE_PENDING",
  // Falta un evento de la etapa anterior: viene en `eventLabel`.
  "EVENT_PENDING",
] as const;

const stageLockSchema = z.object({
  reason: z.enum(stageLockReasons),
  eventLabel: z.string().nullable(),
});

export type StageLock = z.infer<typeof stageLockSchema>;

/** Lo que falta para poder registrar algo en una etapa, dicho como acción. */
export function stageLockLabel({ reason, eventLabel }: StageLock): string {
  switch (reason) {
    case "ARRIVAL_PENDING":
      return "Primero debe llegar a bodega";
    case "SALE_PENDING":
      return "Primero se debe completar la venta";
    case "LABEL_PENDING":
      return "Primero se debe generar la guía";
    case "ROUTE_PENDING":
      return "Primero debe salir a ruta";
    case "EVENT_PENDING":
      return `Primero registra "${eventLabel}"`;
  }
}

export const availableShipmentEventsResponseSchema = z.object({
  events: z.array(availableShipmentEventSchema),
  /** Las etapas cerradas, con lo que falta para abrirlas. */
  stageRequirements: z.partialRecord(z.enum(shipmentStages), stageLockSchema),
});

export type AvailableShipmentEventsResponse = z.infer<
  typeof availableShipmentEventsResponseSchema
>;

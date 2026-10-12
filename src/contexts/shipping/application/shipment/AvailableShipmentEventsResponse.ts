import { shipmentStages } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { z } from "zod";

const evidenceRequirements = ["required", "optional", "none"] as const;

export type EvidenceRequirement = (typeof evidenceRequirements)[number];

/**
 * Un evento del catálogo. Los eventos no tienen reglas: son atajos de texto
 * para el historial, y al avanzar se ofrecen los de la etapa a la que llega.
 * El back manda el catálogo, así que el front no guarda una copia.
 */
export const availableShipmentEventSchema = z.object({
  code: z.string(),
  stage: z.enum(shipmentStages),
  label: z.string(),
  photo: z.enum(evidenceRequirements),
  signature: z.enum(evidenceRequirements),
  requiresLocation: z.boolean(),
  requiresRecipient: z.boolean(),
  /** Ya se registró sobre este envío. */
  recorded: z.boolean(),
  /** Es el que sigue en su etapa según el orden de la guía. */
  suggested: z.boolean(),
});

export type AvailableShipmentEvent = z.infer<
  typeof availableShipmentEventSchema
>;

/** Lo que hace avanzar el envío: el paso que sigue desde donde está. */
export const nextShipmentStepSchema = z.object({
  /** La etapa a la que llega: sus eventos son los atajos para contarlo. */
  stage: z.enum(shipmentStages),
  /** Cómo queda en el historial si no se elige un atajo. */
  label: z.string(),
  eventCode: z.string().nullable(),
  /** Es un paso de la paquetería que Skydropx todavía no avisó: marcarlo
   * pide confirmación. */
  requiresCarrierConfirmation: z.boolean(),
});

export type NextShipmentStep = z.infer<typeof nextShipmentStepSchema>;

const advanceBlocks = [
  "SALE_PENDING",
  "LABEL_PENDING",
  "FINISHED",
  "CANCELLED",
] as const;

export type AdvanceBlock = (typeof advanceBlocks)[number];

/** Por qué no se puede avanzar a mano, dicho al usuario. */
export const ADVANCE_BLOCK_MESSAGES: Record<AdvanceBlock, string> = {
  SALE_PENDING:
    "Para avanzar hay que completar la venta: pesar, tarifar y elegir paquetería.",
  LABEL_PENDING: "Se está generando la guía. Avanzará cuando salga.",
  FINISHED: "El envío ya terminó su recorrido.",
  CANCELLED: "El envío está cancelado.",
};

export const availableShipmentEventsResponseSchema = z.object({
  events: z.array(availableShipmentEventSchema),
  /** Null si no hay nada que avanzar a mano: espera la venta o la guía, o ya
   * terminó. */
  next: nextShipmentStepSchema.nullable(),
  /** Con `next` en null, por qué. */
  blocked: z.enum(advanceBlocks).nullable(),
});

export type AvailableShipmentEventsResponse = z.infer<
  typeof availableShipmentEventsResponseSchema
>;

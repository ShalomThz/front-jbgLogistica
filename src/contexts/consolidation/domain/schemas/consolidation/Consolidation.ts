import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { driverSchema } from "@contexts/shipping/domain/schemas/driver/Driver";
import { trailerSchema } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { consolidationStages } from "./ConsolidationStages";

// Mismo shape que `GeoLocation.toPrimitives()` del back — no se usa todavía en
// la UI (el mapa en vivo está deferido), pero el folio/destino lo pueden
// mandar con ella algún día sin romper el contrato.
export const consolidationGeolocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  placeId: z.string().nullable(),
});

export const consolidationLocationSchema = z.object({
  label: z.string().min(1, "El lugar es requerido"),
  geolocation: consolidationGeolocationSchema.nullable().default(null),
});

export type ConsolidationLocationPrimitives = z.infer<
  typeof consolidationLocationSchema
>;

// El renglón de una orden dentro del consolidado, tal como vive en el
// agregado (`GET /consolidation/:id` lo manda enriquecido aparte, ver
// `consolidatedOrderDetailSchema`).
export const consolidatedOrderSchema = z.object({
  orderId: z.string(),
  linearFeet: z.number().nonnegative(),
  section: z.string().nullable().default(null),
  addedAt: z.string(),
});

export type ConsolidatedOrderPrimitives = z.infer<typeof consolidatedOrderSchema>;

export const consolidationSchema = z.object({
  id: z.string(),
  folio: z.string().min(1, "El folio es requerido"),
  stage: z.enum(consolidationStages),
  origin: consolidationLocationSchema,
  destination: consolidationLocationSchema,
  // Referencia al catálogo de tráilers — ya no es texto libre.
  trailerId: z.string().nullable().default(null),
  driverId: z.string().nullable().default(null),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
  orders: z.array(consolidatedOrderSchema).default([]),
  evidencePhotos: z.array(z.string()).max(4).default([]),
  plannedDepartureAt: z.string().nullable().default(null),
  plannedArrivalAt: z.string().nullable().default(null),
  ...aggregateRootSchema.shape,
});

export type ConsolidationPrimitives = z.infer<typeof consolidationSchema>;

// Cada orden del detalle llega enriquecida con un join en el momento de la
// consulta contra `sales` (no es una copia guardada) — por eso trae
// cliente/destino/referencias/peso y no las cajas de la orden.
export const consolidatedOrderDetailSchema = z.object({
  orderId: z.string(),
  linearFeet: z.number().nonnegative(),
  section: z.string().nullable(),
  addedAt: z.string(),
  orderNumber: z.string().nullable(),
  partnerOrderNumber: z.string().nullable(),
  totalWeightKg: z.number().nonnegative(),
  client: z
    .object({
      id: z.string().nullable(),
      name: z.string(),
      customerNumber: z.number().nullable(),
    })
    .nullable(),
  destination: z.object({ city: z.string(), country: z.string() }).nullable(),
});

export type ConsolidatedOrderDetailPrimitives = z.infer<
  typeof consolidatedOrderDetailSchema
>;

const historyEntryTypes = [
  "CREATED",
  "DETAILS_UPDATED",
  "ORDER_ADDED",
  "ORDER_REMOVED",
  "STAGE_ADVANCED",
  "EVIDENCE_ATTACHED",
] as const;

export const consolidationHistoryEntrySchema = z.object({
  id: z.string(),
  consolidationId: z.string(),
  type: z.enum(historyEntryTypes),
  description: z.string(),
  actorId: z.string(),
  occurredAt: z.string(),
});

export type ConsolidationHistoryEntryPrimitives = z.infer<
  typeof consolidationHistoryEntrySchema
>;

// ── Detail response (GET /consolidation/:id) ───────────────────────────────
// El back arma esta vista con joins al momento de la consulta (orden,
// cliente, conductor, tráiler) más el historial — no es un documento aparte.

export const getConsolidationResponseSchema = z.object({
  consolidation: consolidationSchema,
  driver: driverSchema.nullable(),
  trailer: trailerSchema.nullable(),
  orders: z.array(consolidatedOrderDetailSchema),
  totalLinearFeet: z.number().nonnegative(),
  capacityPercentUsed: z.number(),
  isOverCapacity: z.boolean(),
  isLocked: z.boolean(),
  history: z.array(consolidationHistoryEntrySchema),
});

export type GetConsolidationResponse = z.infer<
  typeof getConsolidationResponseSchema
>;

// ── Requests ─────────────────────────────────────────────────────────────────

export const createConsolidationRequestSchema = z.object({
  folio: z.string().min(1, "El folio es requerido"),
  origin: consolidationLocationSchema,
  destination: consolidationLocationSchema,
  trailerId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
  plannedDepartureAt: z.string().nullable().optional(),
  plannedArrivalAt: z.string().nullable().optional(),
});

export type CreateConsolidationRequest = z.infer<
  typeof createConsolidationRequestSchema
>;

export const updateConsolidationDetailsRequestSchema =
  createConsolidationRequestSchema.partial();

export type UpdateConsolidationDetailsRequest = z.infer<
  typeof updateConsolidationDetailsRequestSchema
>;

export const addOrdersToConsolidationRequestSchema = z.object({
  orders: z
    .array(
      z.object({
        orderId: z.string(),
        linearFeet: z.number().positive(),
        section: z.string().nullable().optional(),
      }),
    )
    .min(1, "Agrega al menos una orden"),
});

export type AddOrdersToConsolidationRequest = z.infer<
  typeof addOrdersToConsolidationRequestSchema
>;

// ── Responses ────────────────────────────────────────────────────────────────

export const consolidationListItemSchema = z.object({
  consolidation: consolidationSchema,
  driver: driverSchema.nullable(),
  totalLinearFeet: z.number().nonnegative(),
  isOverCapacity: z.boolean(),
});

export type ConsolidationListItem = z.infer<typeof consolidationListItemSchema>;

export const findConsolidationsResponseSchema = z.object({
  data: z.array(consolidationListItemSchema),
  pagination: paginationSchema,
});

export type FindConsolidationsResponse = z.infer<
  typeof findConsolidationsResponseSchema
>;

export const addOrdersToConsolidationResponseSchema = z.object({
  consolidation: consolidationSchema,
  capacityWarning: z.boolean(),
});

export type AddOrdersToConsolidationResponse = z.infer<
  typeof addOrdersToConsolidationResponseSchema
>;

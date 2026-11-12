import { storeTypes } from "@contexts/iam/domain/schemas/store/Store";
import { z } from "zod";
import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { driverSchema } from "@contexts/shipping/domain/schemas/driver/Driver";
import { consolidationStages } from "./ConsolidationStages";
import { shipmentStages } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { shipmentStatuses } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";

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
  geolocation: consolidationGeolocationSchema.nullable(),
});

export type ConsolidationLocationPrimitives = z.infer<
  typeof consolidationLocationSchema
>;

/** Revisión del renglón dentro del consolidado — espeja
 * `consolidatedOrderVerificationStatuses` del back. La elige quien verifica;
 * no se deduce de la orden de venta. */
export const consolidatedOrderVerificationStatuses = [
  "PENDING",
  "REVIEWED",
  "ALERT",
] as const;

export type ConsolidatedOrderVerificationStatus =
  (typeof consolidatedOrderVerificationStatuses)[number];

export const VERIFICATION_LABELS: Record<ConsolidatedOrderVerificationStatus, string> = {
  PENDING: "Pendiente",
  REVIEWED: "Revisado",
  ALERT: "Alerta",
};

/** Un tono por estado, para que la columna, el filtro y la barra de avance
 * pinten igual: pendiente espera a alguien, alerta es un problema. */
export const VERIFICATION_TONE: Record<ConsolidatedOrderVerificationStatus, StatusTone> = {
  PENDING: "waiting",
  REVIEWED: "done",
  ALERT: "stopped",
};

// El renglón de una orden dentro del consolidado, tal como vive en el
// agregado (`GET /consolidation/:id` lo manda enriquecido aparte, ver
// `consolidatedOrderDetailSchema`).
export const consolidatedOrderSchema = z.object({
  orderId: z.string(),
  linearFeet: z.number().nonnegative(),
  section: z.string().nullable(),
  comment: z.string().nullable(),
  verifiedByUserId: z.string().nullable(),
  verificationStatus: z.enum(consolidatedOrderVerificationStatuses),
  // Cuándo se marcó Revisado/Alerta. `null` en Pendiente.
  verifiedAt: z.string().nullable(),
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
  trailerId: z.string().nullable(),
  driverId: z.string().nullable(),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
  // Divisor de alto×largo×ancho (pulgadas) con el que se sugieren los pies
  // lineales al agregar órdenes — elegido una vez al crear el consolidado.
  linearFeetDivisor: z.number().positive(),
  orders: z.array(consolidatedOrderSchema),
  evidencePhotos: z.array(z.string()).max(4),
  plannedDepartureAt: z.string().nullable(),
  plannedArrivalAt: z.string().nullable(),
  // Tráiler y conductor congelados al sellar; `null` mientras sigue abierto.
  sealed: z
    .object({
      at: z.string(),
      trailer: z
        .object({ unitNumber: z.string(), type: z.string(), plates: z.string() })
        .nullable(),
      driver: z
        .object({ name: z.string(), licenseNumber: z.string() })
        .nullable(),
    })
    .nullable(),
  // Versión del documento (control de concurrencia en el back).
  version: z.number(),
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
  comment: z.string().nullable(),
  verifiedByUserId: z.string().nullable(),
  verificationStatus: z.enum(consolidatedOrderVerificationStatuses),
  // Cuándo se marcó Revisado/Alerta. `null` en Pendiente.
  verifiedAt: z.string().nullable(),
  addedAt: z.string(),
  orderNumber: z.string().nullable(),
  partnerOrderNumber: z.string().nullable(),
  totalWeightKg: z.number().nonnegative(),
  // Estado real de la orden/envío — no es un workflow nuevo, son los mismos
  // valores que ya usa el resto de la app.
  orderStatus: z.enum(["DRAFT", "PENDING_HQ_PROCESS", "COMPLETED", "CANCELLED"]).nullable(),
  // "Rastreo" sale del envío: la etapa es la etiqueta, el estatus el color
  // y los cortes (cancelado/devuelto), y una incidencia lo vuelve problema.
  shipmentStage: z.enum(shipmentStages).nullable(),
  shipmentStatus: z.enum(shipmentStatuses).nullable(),
  hasShipmentIncident: z.boolean(),
  // Paquetería externa (Skydropx): "Rastreo" la marca directo como entregada —
  // para JBG ya salió al entregarla a la paquetería.
  carrierType: z.enum(["INTERNAL_FLEET", "THIRD_PARTY"]).nullable(),
  client: z
    .object({
      id: z.string().nullable(),
      name: z.string(),
      customerNumber: z.number().nullable(),
    })
    .nullable(),
  destination: z.object({ city: z.string(), country: z.string() }).nullable(),
  // Paquetería y guía del envío — `null` sin envío o sin guía.
  carrierName: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  // Tienda/agencia que levantó la orden. `null` si ya no existe.
  store: z
    .object({ id: z.string(), name: z.string(), type: z.enum(storeTypes) })
    .nullable(),
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
  "ORDER_COMMENTS_UPDATED",
] as const;

export const consolidationHistoryEntrySchema = z.object({
  id: z.string(),
  consolidationId: z.string(),
  type: z.enum(historyEntryTypes),
  description: z.string(),
  // Qué cambió exactamente, en líneas legibles. Vacío si la descripción ya
  // lo dice todo.
  details: z.array(z.string()),
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
  // Sólo lo que muestra el detalle, no los documentos de los catálogos. Con
  // el consolidado sellado son los datos congelados al sellar.
  driver: z
    .object({ id: z.string(), name: z.string(), licenseNumber: z.string() })
    .nullable(),
  trailer: z
    .object({
      id: z.string(),
      unitNumber: z.string(),
      type: z.string(),
      plates: z.string(),
    })
    .nullable(),
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
  linearFeetDivisor: z.number().positive().optional(),
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

export const updateConsolidationOrderCommentsRequestSchema = z.object({
  comments: z
    .array(
      z.object({
        orderId: z.string(),
        comment: z.string().max(500).nullable(),
        verifiedByUserId: z.string().nullable(),
        verificationStatus: z.enum(consolidatedOrderVerificationStatuses),
      }),
    )
    .min(1),
});

export type UpdateConsolidationOrderCommentsRequest = z.infer<
  typeof updateConsolidationOrderCommentsRequestSchema
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

/** Métricas del listado, sobre toda la colección (el listado pagina). */
export const consolidationStatsSchema = z.object({
  byStage: z.record(z.enum(consolidationStages), z.number().int().nonnegative()),
  loadedOrders: z.number().int().nonnegative(),
});

export type ConsolidationStats = z.infer<typeof consolidationStatsSchema>;

export const createConsolidationResponseSchema = z.object({
  consolidation: consolidationSchema,
});

export type CreateConsolidationResponse = z.infer<
  typeof createConsolidationResponseSchema
>;

export const addOrdersToConsolidationResponseSchema = z.object({
  consolidation: consolidationSchema,
  capacityWarning: z.boolean(),
});

export type AddOrdersToConsolidationResponse = z.infer<
  typeof addOrdersToConsolidationResponseSchema
>;

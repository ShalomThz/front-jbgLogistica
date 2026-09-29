import { stageLockLabel } from "@contexts/shipping/application/shipment/AvailableShipmentEventsResponse";
import type { ShipmentStage } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { useQuery } from "@tanstack/react-query";
import { shipmentRepository } from "../../services/shipments/shipmentRepository";

export const useShipmentByOrderId = (orderId: string | undefined) =>
  useQuery({
    queryKey: ["shipments", "byOrder", orderId],
    queryFn: () => shipmentRepository.findByOrderId(orderId!),
    enabled: !!orderId,
  });

/**
 * Un envío por su id. Existe para las pantallas que tienen el id pero no el
 * envío —el detalle de la ruta, donde la parada solo guarda `shipmentId`— y por
 * eso se pide bajo demanda con `enabled`, no al montar.
 */
export const useShipmentById = (
  shipmentId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: ["shipments", "byId", shipmentId],
    queryFn: () => shipmentRepository.findById(shipmentId!),
    enabled: enabled && !!shipmentId,
  });

/** Aparte de `["shipments"]` para poder invalidar solo el historial. Cubre
 * también los eventos disponibles, que cambian con cada registro. */
export const SHIPMENT_TRACKING_QUERY_KEY = ["shipment-tracking"];

/**
 * Sin los 5 minutos de caché del resto: el historial cambia por cosas que no
 * pasan en esta pantalla —completar la venta, el chofer en su app, el webhook
 * de la paquetería, arrancar una ruta— y con caché el diálogo seguía mostrando
 * lo de antes hasta recargar. Se vuelve a pedir cada vez que se abre.
 */
const ALWAYS_FRESH = { staleTime: 0 } as const;

/** El historial completo del envío, para el detalle de la orden. */
export const useShipmentTracking = (
  shipmentId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: [...SHIPMENT_TRACKING_QUERY_KEY, "events", shipmentId],
    queryFn: () => shipmentRepository.tracking(shipmentId!),
    enabled: enabled && !!shipmentId,
    ...ALWAYS_FRESH,
  });

/** Lo que se puede registrar ahora; se pide al abrir el diálogo. */
export const useAvailableShipmentEvents = (
  shipmentId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: [...SHIPMENT_TRACKING_QUERY_KEY, "available", shipmentId],
    queryFn: () => shipmentRepository.availableEvents(shipmentId!),
    enabled: enabled && !!shipmentId,
    ...ALWAYS_FRESH,
  });

/**
 * Qué falta en las etapas cerradas, para marcarlo con candado sobre la línea
 * de tiempo, y la etapa que sigue cuando la actual ya está cumplida (null si
 * no). Lo usan el diálogo de registrar evento y el Historial de la orden; las
 * consultas son las mismas, así que no se piden dos veces.
 */
export const useStageLocks = (
  shipmentId: string | undefined,
  stages: readonly ShipmentStage[],
  current: ShipmentStage | null,
  enabled = true,
) => {
  const { data: availability } = useAvailableShipmentEvents(
    shipmentId,
    enabled,
  );
  const { data: history = [] } = useShipmentTracking(shipmentId, enabled);

  // Lo que falta en cada etapa cerrada, dicho como acción.
  const requirements = Object.fromEntries(
    Object.entries(availability?.stageRequirements ?? {}).map(
      ([stage, lock]) => [stage, stageLockLabel(lock)],
    ),
  ) as Partial<Record<ShipmentStage, string>>;

  // Abiertas: las que tienen algún evento que se puede registrar ya.
  const openStages = new Set(
    (availability?.events ?? []).filter((e) => !e.blocked).map((e) => e.stage),
  );

  // La etapa actual está cumplida cuando la siguiente ya se abrió —su evento
  // de apertura se registró— y algo se registró en ella. Lo segundo evita
  // darla por cumplida en los pasos que abre el estatus y no un evento: una
  // recolección a domicilio ya puede registrar "Recibido en bodega" sin que el
  // agente haya hecho nada. Cumplida, lo que sigue es la siguiente.
  const nextStage = current ? stages[stages.indexOf(current) + 1] : undefined;
  const currentCompleted =
    !!current &&
    !!nextStage &&
    openStages.has(nextStage) &&
    history.some((e) => e.eventCode && e.stage === current);

  return {
    requirements,
    nextStage: currentCompleted ? (nextStage ?? null) : null,
  };
};

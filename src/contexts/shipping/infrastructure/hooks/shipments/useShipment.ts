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

/** El catálogo de eventos y lo que hace avanzar; se pide al abrir el diálogo. */
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

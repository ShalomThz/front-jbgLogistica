import { useEffect } from "react";
import { io } from "socket.io-client";
import { queryClient } from "@/lib/queryClient";

interface DomainEvent {
  eventName: string;
  entityId: string;
  eventId: string;
  occurredOn: string;
  [key: string]: unknown;
}

/**
 * Qué consultas refrescar cuando llega un evento de cada entidad. Una entidad
 * puede afectar a varias: la orden **embebe** su envío en la vista de lista —de
 * ahí leen la tabla, el encabezado del detalle y la línea de tiempo—, y el back
 * la reproyecta con los eventos del envío. Refrescando solo `shipments`, un
 * envío que avanzaba (venta completada, webhook, entrega del chofer, evento
 * registrado) no se veía hasta recargar la página.
 */
const EVENT_QUERY_MAP: Record<string, readonly string[][]> = {
  zone: [["zones"]],
  order: [["orders"]],
  package: [["packages"]],
  shipment: [["shipments"], ["orders"], ["shipment-tracking"]],
  route: [["routes"]],
  driver: [["drivers"]],
  store: [["stores"]],
  user: [["users"]],
  box: [["boxes"]],
  tariff: [["tariffs"]],
  customer: [["customers"]],
};

const NOTIFICATION_EVENT_NAMES = new Set([
  "order.created",
  "order.priced",
  "shipment.fulfilled",
  "shipment.cancelled",
  "shipment.returned",
  "shipment.in_route",
  "shipment.delivered",
  "route.stop.delivered",
  "route.stop.attempt_failed",
  "route.stop.skipped",
  "route.started",
  "route.completed",
  "route.cancelled",
  "box.sale.made",
  "package.group.authorized",
]);

function handleDomainEvent(event: DomainEvent) {
  const [entity, action] = event.eventName.split(".");

  // Transient progress signals (e.g. shipment creation sub-status) are consumed
  // by dedicated listeners; ignore them here (no refetch).
  if (action === "creation_progress") return;

  if (NOTIFICATION_EVENT_NAMES.has(event.eventName)) {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  for (const queryKey of EVENT_QUERY_MAP[entity] ?? []) {
    queryClient.invalidateQueries({ queryKey });
  }
}

export function useWebSocketEvents(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3000", {
      transports: ["websocket"],
    });

    socket.on("domain-event", handleDomainEvent);

    return () => {
      socket.disconnect();
    };
  }, [enabled]);
}

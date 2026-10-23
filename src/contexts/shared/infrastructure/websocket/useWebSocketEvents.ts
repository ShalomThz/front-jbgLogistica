import { useEffect } from "react";
import { io } from "socket.io-client";
import type { Query } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { FindOrdersResponse } from "@contexts/sales/application/order/FindOrderResponse";
import type { OrderListViewResponse } from "@contexts/sales/application/order/OrderResponse";
import {
  shipmentResponseSchema,
  type ShipmentResponsePrimitives,
} from "@contexts/shipping/application/shipment/ShipmentResponse";

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
  // También el usuario en sesión (`useAuth`): si le cambiaron el rol, el menú y
  // los botones tienen que reflejarlo sin recargar. El back ya lo aplica en la
  // siguiente petición.
  user: [["users"], ["auth", "user"]],
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

  if (entity === "shipment" && applyShipmentEvent(event)) return;

  for (const queryKey of EVENT_QUERY_MAP[entity] ?? []) {
    queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Un envío que cambia no recarga todas las órdenes. Los webhooks de la
 * paquetería y los choferes mandan eventos de envío todo el tiempo, y cada uno
 * hacía que todos los navegadores volvieran a pedir cada lista de órdenes
 * abierta. El evento ya trae el envío completo:
 *
 * - Donde la orden ya está en memoria —listas y detalle—, se le cambia el
 *   envío en el lugar, sin pedir nada.
 * - Las listas filtradas por el envío (estatus, proveedor) se vuelven a pedir:
 *   la orden puede entrar o salir de ellas.
 * - El resto queda marcado como viejo y se pide la próxima vez que se abra.
 * - Del historial, solo el de este envío.
 *
 * Devuelve false si el envío del evento no se pudo leer: ahí se refresca todo,
 * como antes.
 */
function applyShipmentEvent(event: DomainEvent): boolean {
  const parsed = shipmentResponseSchema.safeParse(event.shipment);
  if (!parsed.success) return false;
  putShipmentInOrderCaches(parsed.data);
  return true;
}

/**
 * Pone el envío en las órdenes que ya están en memoria, sin esperar a que el
 * back reproyecte la tabla de órdenes. Lo usan el socket y las respuestas que
 * ya traen el envío completo, como "Actualizar envío": refrescar ahí mismo
 * traería la copia de la tabla todavía sin la guía.
 */
export function putShipmentInOrderCaches(shipment: ShipmentResponsePrimitives) {
  queryClient.invalidateQueries({ queryKey: ["shipments"] });
  queryClient.invalidateQueries({
    queryKey: ["shipment-tracking"],
    predicate: (query) => query.queryKey.includes(shipment.id),
  });

  queryClient.setQueriesData<FindOrdersResponse | OrderListViewResponse>(
    { queryKey: ["orders"] },
    (data) => withShipment(data, shipment),
  );
  queryClient.invalidateQueries({
    queryKey: ["orders"],
    predicate: filtersByShipment,
  });
  queryClient.invalidateQueries({ queryKey: ["orders"], refetchType: "none" });
}

/** La lista o el detalle con el envío nuevo en su orden, si la tiene. Una foto
 * más vieja que la que ya está se ignora: los eventos llegan desordenados. */
function withShipment<T extends FindOrdersResponse | OrderListViewResponse>(
  data: T | undefined,
  shipment: ShipmentResponsePrimitives,
): T | undefined {
  if (!data) return data;

  const patch = (order: OrderListViewResponse): OrderListViewResponse => {
    if (order.id !== shipment.orderId) return order;
    const current = order.shipment;
    if (
      current?.id === shipment.id &&
      new Date(shipment.updatedAt) < new Date(current.updatedAt)
    ) {
      return order;
    }
    return { ...order, shipment };
  };

  if ("data" in data && Array.isArray(data.data)) {
    return { ...data, data: data.data.map(patch) };
  }
  return patch(data as OrderListViewResponse) as T;
}

/** Una lista de órdenes filtrada por algo del envío: su contenido depende de él. */
function filtersByShipment(query: Query): boolean {
  const params = query.queryKey[1] as { filters?: { field: string }[] } | undefined;
  return (
    params?.filters?.some((filter) => filter.field.startsWith("shipment.")) ??
    false
  );
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

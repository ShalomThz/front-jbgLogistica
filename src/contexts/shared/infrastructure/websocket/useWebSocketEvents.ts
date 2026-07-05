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

const EVENT_QUERY_MAP: Record<string, string[]> = {
  zone: ["zones"],
  order: ["orders"],
  package: ["packages"],
  shipment: ["shipments"],
  route: ["routes"],
  driver: ["drivers"],
  store: ["stores"],
  user: ["users"],
  box: ["boxes"],
  tariff: ["tariffs"],
  customer: ["customers"],
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

  const queryKey = EVENT_QUERY_MAP[entity];

  if (queryKey) {
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

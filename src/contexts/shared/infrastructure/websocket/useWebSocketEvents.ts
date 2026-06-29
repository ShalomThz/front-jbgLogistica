import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
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

const ACTION_SUFFIX: Record<string, { m: string; f: string }> = {
  created: { m: "creado", f: "creada" },
  updated: { m: "actualizado", f: "actualizada" },
  deleted: { m: "eliminado", f: "eliminada" },
};

const ENTITY_CONFIG: Record<string, { label: string; gender: "m" | "f" }> = {
  zone: { label: "Zona", gender: "f" },
  order: { label: "Orden", gender: "f" },
  package: { label: "Paquete", gender: "m" },
  shipment: { label: "Envío", gender: "m" },
  route: { label: "Ruta", gender: "f" },
  driver: { label: "Conductor", gender: "m" },
  store: { label: "Tienda", gender: "f" },
  user: { label: "Usuario", gender: "m" },
  box: { label: "Caja", gender: "f" },
  tariff: { label: "Tarifa", gender: "f" },
  customer: { label: "Cliente", gender: "m" },
};

function handleDomainEvent(event: DomainEvent) {
  const [entity, action] = event.eventName.split(".");

  // Transient progress signals (e.g. shipment creation sub-status) are consumed
  // by dedicated listeners; ignore them here (no toast, no refetch).
  if (action === "creation_progress") return;

  const queryKey = EVENT_QUERY_MAP[entity];

  if (queryKey) {
    queryClient.invalidateQueries({ queryKey });
  }

  const config = ENTITY_CONFIG[entity];
  const entityLabel = config?.label ?? entity;
  const gender = config?.gender ?? "m";
  const actionLabel = ACTION_SUFFIX[action]?.[gender] ?? action;

  if (action === "deleted") {
    toast.warning(`${entityLabel} ${actionLabel}`);
  } else {
    toast.success(`${entityLabel} ${actionLabel}`);
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

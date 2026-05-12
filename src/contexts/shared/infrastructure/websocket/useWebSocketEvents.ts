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

const ACTION_LABEL: Record<string, string> = {
  created: "creado",
  updated: "actualizado",
  deleted: "eliminado",
};

const ENTITY_LABEL: Record<string, string> = {
  zone: "Zona",
  order: "Orden",
  package: "Paquete",
  shipment: "Envío",
  route: "Ruta",
  driver: "Conductor",
  store: "Tienda",
  user: "Usuario",
  box: "Caja",
  tariff: "Tarifa",
  customer: "Cliente",
};

function handleDomainEvent(event: DomainEvent) {
  const [entity, action] = event.eventName.split(".");
  const queryKey = EVENT_QUERY_MAP[entity];

  if (queryKey) {
    queryClient.invalidateQueries({ queryKey });
  }

  const entityLabel = ENTITY_LABEL[entity] ?? entity;
  const actionLabel = ACTION_LABEL[action] ?? action;

  if (action === "deleted") {
    toast.warning(`${entityLabel} ${actionLabel}`);
  } else {
    toast.success(`${entityLabel} ${actionLabel}`);
  }
}

export function useWebSocketEvents() {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3000", {
      transports: ["websocket"],
    });

    socket.on("domain-event", handleDomainEvent);

    return () => {
      socket.disconnect();
    };
  }, []);
}

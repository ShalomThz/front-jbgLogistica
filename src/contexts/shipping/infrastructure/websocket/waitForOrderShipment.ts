import { io } from "socket.io-client";
import type { ShipmentResponsePrimitives } from "@contexts/shipping/application/shipment/ShipmentResponse";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";

interface ShipmentDomainEvent {
  eventName: string;
  shipment?: { orderId?: string };
}

interface WaitOptions {
  timeoutMs: number;
  /** Cada cuánto se lee de respaldo, por si el evento se pierde o el socket no
   *  conecta. */
  pollIntervalMs: number;
  /** La lectura que manda (`findByOrderId`): es la que se devuelve. */
  read: () => Promise<ShipmentResponsePrimitives | null>;
}

/**
 * Espera el envío de una orden recién creada. El back lo crea en la cola, con
 * `OrderCreated`, así que puede no existir en el instante en que vuelve la
 * creación de la orden; suele tardar milisegundos.
 *
 * Escucha el `shipment.created` de esa orden por socket.io y, mientras, lee de
 * respaldo por si el evento se pierde o el socket no conecta. Devuelve el
 * envío, o null si se vence el tiempo.
 */
export function waitForOrderShipment(
  orderId: string,
  { timeoutMs, pollIntervalMs, read }: WaitOptions,
): Promise<ShipmentResponsePrimitives | null> {
  return new Promise((resolve) => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    let settled = false;

    const finish = (shipment: ShipmentResponsePrimitives | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(interval);
      socket.off("domain-event", onEvent);
      socket.disconnect();
      resolve(shipment);
    };

    const check = async () => {
      try {
        const shipment = await read();
        if (shipment) finish(shipment);
      } catch {
        // Falla pasajera: se espera el socket o la siguiente lectura.
      }
    };

    // El evento solo avisa; lo que se devuelve sale de la lectura, que trae la
    // forma completa de la respuesta.
    const onEvent = (event: ShipmentDomainEvent) => {
      if (event.eventName !== "shipment.created") return;
      if (event.shipment?.orderId !== orderId) return;
      void check();
    };

    const interval = setInterval(() => void check(), pollIntervalMs);
    const timer = setTimeout(() => finish(null), timeoutMs);

    socket.on("domain-event", onEvent);
    // Lo normal es que ya exista: se mira de una vez.
    void check();
  });
}

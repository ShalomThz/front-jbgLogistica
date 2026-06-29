import { io } from "socket.io-client";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";

export type FulfillmentOutcome = "fulfilled" | "failed" | "timeout";

interface ShipmentDomainEvent {
  eventName: string;
  entityId: string;
  shipment?: ShipmentPrimitives;
  description?: string;
  workflowStatus?: string;
}

interface WaitOptions {
  timeoutMs: number;
  /** Backstop interval: read the shipment in case the event is missed or the
   *  socket never connects. Much less frequent than legacy polling. */
  pollIntervalMs: number;
  /** Authoritative read used by the backstop (e.g. findByOrderId). */
  read: () => Promise<ShipmentPrimitives | null>;
  /** Optional: receives the carrier's creation sub-status as it progresses. */
  onStatus?: (progress: { description: string; workflowStatus: string }) => void;
}

/** Classifies a shipment snapshot into a terminal fulfillment outcome, or null
 *  if still in progress. */
function evaluate(
  shipment: ShipmentPrimitives | null | undefined,
): FulfillmentOutcome | null {
  if (!shipment) return null;
  if (shipment.status === "FULFILLED") return "fulfilled";
  if (shipment.status === "PROVIDER_SELECTED" && !shipment.providerShipmentId) {
    return "failed";
  }
  return null;
}

/**
 * Waits for the carrier to complete the async label creation, observed via the
 * domain events the backend broadcasts over socket.io once the Skydropx webhook
 * lands. Resolves "fulfilled" (Created), "failed" (Error revert) or "timeout".
 *
 * Robustness: alongside the socket it runs an infrequent backstop read, so a
 * missed event or an unreachable websocket still converges quickly instead of
 * hanging until the timeout.
 */
export function waitForShipmentFulfillment(
  shipmentId: string,
  { timeoutMs, pollIntervalMs, read, onStatus }: WaitOptions,
): Promise<FulfillmentOutcome> {
  return new Promise((resolve) => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    let settled = false;

    const finish = (outcome: FulfillmentOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(interval);
      socket.off("domain-event", onEvent);
      socket.disconnect();
      resolve(outcome);
    };

    const onEvent = (event: ShipmentDomainEvent) => {
      if (event.entityId !== shipmentId) return;
      if (event.eventName === "shipment.creation_progress") {
        if (event.description) {
          onStatus?.({
            description: event.description,
            workflowStatus: event.workflowStatus ?? "",
          });
        }
        return;
      }
      if (event.eventName === "shipment.fulfilled") return finish("fulfilled");
      const outcome = evaluate(event.shipment);
      if (outcome) finish(outcome);
    };

    const interval = setInterval(async () => {
      try {
        const outcome = evaluate(await read());
        if (outcome) finish(outcome);
      } catch {
        // Transient read failure — keep waiting for the socket / next backstop.
      }
    }, pollIntervalMs);

    const timer = setTimeout(() => finish("timeout"), timeoutMs);

    socket.on("domain-event", onEvent);
  });
}

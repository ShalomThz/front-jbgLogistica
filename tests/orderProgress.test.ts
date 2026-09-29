import {
  ORDER_MILESTONES,
  orderProgress,
  orderTimelineStages,
} from "@contexts/order-flow/domain/services/orderProgress";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import type { ShipmentIncidentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { ShipmentStage } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import type { ShipmentStatus } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { describe, expect, it } from "vitest";

interface ShipmentShape {
  status: ShipmentStatus;
  stage: ShipmentStage | null;
  incident?: ShipmentIncidentPrimitives | null;
  carrier?: "INTERNAL_FLEET" | "THIRD_PARTY";
}

/** Solo los campos que `orderProgress` mira; el resto de la vista no le
 *  importa, así que no se construye. */
function makeOrder(
  status: OrderStatus,
  shipment?: ShipmentShape,
  extra: Partial<Pick<OrderListView, "type" | "emptyBoxDelivery" | "homePickup">> = {},
): OrderListView {
  return {
    status,
    type: "HQ",
    emptyBoxDelivery: false,
    homePickup: false,
    ...extra,
    shipment: shipment
      ? {
          status: shipment.status,
          stage: shipment.stage,
          incident: shipment.incident ?? null,
          provider: shipment.carrier
            ? { type: shipment.carrier, providerName: "x" }
            : null,
        }
      : null,
  } as unknown as OrderListView;
}

const HELD: ShipmentIncidentPrimitives = {
  type: "HELD",
  reason: "Retenido en aduana",
  openedAt: "2026-09-27T18:30:00.000Z",
  openedBy: "user-1",
};

describe("orderProgress", () => {
  describe("la etapa manda la etiqueta", () => {
    it("dice la etapa del cliente, no el estatus operativo", () => {
      const progress = orderProgress(
        makeOrder("COMPLETED", { status: "FULFILLED", stage: "IN_TRANSIT" }),
      );
      expect(progress.label).toBe("En tránsito");
      expect(progress.reached).toBe(4);
    });

    it("el estatus operativo va de segunda línea cuando dice qué falta", () => {
      const progress = orderProgress(
        makeOrder("PENDING_HQ_PROCESS", {
          status: "AWAITING_PICKUP",
          stage: "AGENT",
        }),
      );
      expect(progress.label).toBe("Agente");
      expect(progress.detail).toBe("Por recolectar a domicilio");
    });

    it("'Por despachar' deja de decirse cuando ya salió de origen", () => {
      expect(
        orderProgress(
          makeOrder("COMPLETED", { status: "FULFILLED", stage: "ORIGIN_WAREHOUSE" }),
        ).detail,
      ).toBe("Por despachar");
      expect(
        orderProgress(
          makeOrder("COMPLETED", { status: "FULFILLED", stage: "DISPATCHED" }),
        ).detail,
      ).toBe("");
    });

    it("no repite: 'En ruta' bajo 'En ruta' no agrega nada", () => {
      expect(
        orderProgress(
          makeOrder("COMPLETED", { status: "IN_ROUTE", stage: "OUT_FOR_DELIVERY" }),
        ).detail,
      ).toBe("");
    });

    it("entregado llega al último tramo", () => {
      const progress = orderProgress(
        makeOrder("COMPLETED", { status: "DELIVERED", stage: "DELIVERED" }),
      );
      expect(progress.reached).toBe(ORDER_MILESTONES.length);
      expect(progress.tone).toBe("done");
    });
  });

  describe("antes de arrancar", () => {
    it("una de mostrador sin capturar dice Borrador", () => {
      const progress = orderProgress(makeOrder("DRAFT"));
      expect(progress.label).toBe("Borrador");
      expect(progress.reached).toBe(0);
      expect(progress.tone).toBe("draft");
    });

    it("una de agente terminada espera a JBG", () => {
      const progress = orderProgress(makeOrder("PENDING_HQ_PROCESS"));
      expect(progress.label).toBe("Por procesar");
      expect(progress.tone).toBe("waiting");
    });
  });

  describe("el tono dice de quién es la pelota", () => {
    it("ámbar mientras JBG debe procesarla", () => {
      expect(
        orderProgress(
          makeOrder("PENDING_HQ_PROCESS", { status: "AT_WAREHOUSE", stage: "AGENT" }),
        ).tone,
      ).toBe("waiting");
    });

    it("azul en todo el tránsito", () => {
      for (const stage of ["DISPATCHED", "IN_TRANSIT", "DISTRIBUTION"] as const) {
        expect(
          orderProgress(makeOrder("COMPLETED", { status: "FULFILLED", stage })).tone,
        ).toBe("transit");
      }
    });

    it("una incidencia abierta lo vuelve problema, sin mover la etapa", () => {
      const progress = orderProgress(
        makeOrder("COMPLETED", {
          status: "FULFILLED",
          stage: "IN_TRANSIT",
          incident: HELD,
        }),
      );
      expect(progress.tone).toBe("stopped");
      expect(progress.label).toBe("En tránsito");
      expect(progress.hint).toContain("Retenido");
      expect(progress.incident?.type).toBe("HELD");
    });
  });

  describe("los cortes ganan sobre cualquier avance", () => {
    it("una orden cancelada se lee cancelada", () => {
      const progress = orderProgress(
        makeOrder("CANCELLED", { status: "IN_ROUTE", stage: "OUT_FOR_DELIVERY" }),
      );
      expect(progress.label).toBe("Cancelada");
      expect(progress.tone).toBe("stopped");
    });

    it("devuelta corta, y conserva hasta dónde llegó", () => {
      const progress = orderProgress(
        makeOrder("COMPLETED", { status: "RETURNED", stage: "OUT_FOR_DELIVERY" }),
      );
      expect(progress.label).toBe("Devuelta al remitente");
      expect(progress.reached).toBe(7);
    });
  });
});

describe("orderTimelineStages", () => {
  it("una de mostrador arranca en la bodega de origen", () => {
    const stages = orderTimelineStages(
      makeOrder("COMPLETED", { status: "FULFILLED", stage: "ORIGIN_WAREHOUSE" }),
    );
    expect(stages[0]).toBe("ORIGIN_WAREHOUSE");
    expect(stages).toHaveLength(7);
  });

  it("una de socio empieza con el agente", () => {
    const stages = orderTimelineStages(
      makeOrder("PENDING_HQ_PROCESS", { status: "AWAITING_AGENCY_PICKUP", stage: "AGENT" }, { type: "PARTNER" }),
    );
    expect(stages[0]).toBe("AGENT");
  });

  it("una de paquetería no pasa por la bodega de destino", () => {
    const stages = orderTimelineStages(
      makeOrder("COMPLETED", {
        status: "IN_ROUTE",
        stage: "IN_TRANSIT",
        carrier: "THIRD_PARTY",
      }),
    );
    expect(stages).not.toContain("DESTINATION_WAREHOUSE");
  });
});

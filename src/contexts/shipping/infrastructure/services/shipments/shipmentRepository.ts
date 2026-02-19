import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  shipmentSchema,
  type ShipmentPrimitives,
} from "../../../domain/schemas/shipment/Shipment";
import {
  findShipmentsResponseSchema,
  type FindShipmentsResponse,
} from "../../../application/shipment/FindShipmentsResponse";
import type { GetShipmentRatesRequest } from "../../../application/shipment/GetshipmentRatesRequest";
import type { SelectShipmentProviderRequest } from "../../../application/shipment/GetshipmentProviderRequest";
import { rateSchema, type RatePrimitives } from "../../../domain/schemas/value-objects/Rate";
import { z } from "zod";

export const shipmentRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindShipmentsResponse> => {
    const data = await httpClient<unknown>("/shipment/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findShipmentsResponseSchema.parse(data);
  },

  findByOrderId: async (orderId: string): Promise<ShipmentPrimitives | null> => {
    const data = await httpClient<unknown>("/shipment/find", {
      method: "POST",
      body: JSON.stringify({
        filters: [{ field: "orderId", filterOperator: "=", value: orderId }],
        limit: 1,
      }),
    });
    const response = findShipmentsResponseSchema.parse(data);
    return response.data[0] ?? null;
  },

  fulfill: async (shipmentId: string): Promise<ShipmentPrimitives> => {
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/fulfill`,
      { method: "POST" },
    );
    return shipmentSchema.parse(data);
  },

  getRates: async (
    request: GetShipmentRatesRequest,
  ): Promise<RatePrimitives[]> => {
    const { shipmentId, additionalData } = request;
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/rates`,
      {
        method: "POST",
        body: JSON.stringify({ additionalData }),
      },
    );
    return z.array(rateSchema).parse(data);
  },

  selectProvider: async (
    request: SelectShipmentProviderRequest,
  ): Promise<ShipmentPrimitives> => {
    const { shipmentId, ...body } = request;
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/provider`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return shipmentSchema.parse(data);
  },
};

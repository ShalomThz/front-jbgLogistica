import { httpClient, httpClientBlob } from "@contexts/shared/infrastructure/http/httpClient";
import {
  shipmentResponseSchema,
  type ShipmentResponsePrimitives,
} from "../../../application/shipment/ShipmentResponse";
import {
  findShipmentsResponseSchema,
  type FindShipmentsResponse,
} from "../../../application/shipment/FindShipmentsResponse";
import type { GetShipmentRatesRequest } from "../../../application/shipment/GetshipmentRatesRequest";
import type { UpdateShipmentGeolocationRequest } from "../../../application/shipment/UpdateShipmentGeolocationRequest";
import type { SelectShipmentProviderRequest } from "../../../application/shipment/GetshipmentProviderRequest";
import { rateSchema, type RatePrimitives } from "../../../domain/schemas/value-objects/Rate";
import {
  DEFAULT_LABEL_VARIANT,
  type LabelVariant,
} from "../../../domain/schemas/value-objects/LabelVariant";
import { z } from "zod";

export const shipmentRepository = {
  /** Verified routing coordinates for orders captured without the map picker */
  updateGeolocation: async ({
    shipmentId,
    kind,
    geolocation,
  }: UpdateShipmentGeolocationRequest): Promise<void> => {
    await httpClient<unknown>(`/shipment/${shipmentId}/geolocation`, {
      method: "PUT",
      body: JSON.stringify({ kind, geolocation }),
    });
  },

  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindShipmentsResponse> => {
    const data = await httpClient<unknown>("/shipment/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findShipmentsResponseSchema.parse(data);
  },

  findByOrderId: async (orderId: string): Promise<ShipmentResponsePrimitives | null> => {
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

  fulfill: async (shipmentId: string): Promise<ShipmentResponsePrimitives> => {
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/fulfill`,
      { method: "POST" },
    );
    return shipmentResponseSchema.parse(data);
  },

  /** Aborts a shipment stuck in creation (reverts to PROVIDER_SELECTED for
   * retry). Distinct from `cancel`, which cancels a fulfilled shipment. */
  abortCreation: async (
    shipmentId: string,
  ): Promise<ShipmentResponsePrimitives> => {
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/abort-creation`,
      { method: "POST" },
    );
    return shipmentResponseSchema.parse(data);
  },

  getRates: async (
    request: GetShipmentRatesRequest,
  ): Promise<RatePrimitives[]> => {
    const { shipmentId, additionalData, warehouseAddress } = request;
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/rates`,
      {
        method: "POST",
        body: JSON.stringify({ additionalData, warehouseAddress }),
      },
    );
    return z.array(rateSchema).parse(data);
  },

  selectProvider: async (
    request: SelectShipmentProviderRequest,
  ): Promise<ShipmentResponsePrimitives> => {
    const { shipmentId, ...body } = request;
    const data = await httpClient<unknown>(
      `/shipment/${shipmentId}/provider`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return shipmentResponseSchema.parse(data);
  },

  getLabel: async (
    shipmentId: string,
    variant: LabelVariant = DEFAULT_LABEL_VARIANT,
  ): Promise<Blob> => {
    return httpClientBlob(
      `/shipment/${shipmentId}/label?variant=${variant}`,
    );
  },

  cancel: async (shipmentId: string): Promise<void> => {
    await httpClient<unknown>(`/shipment/${shipmentId}/cancel`, {
      method: "DELETE",
    });
  },
};

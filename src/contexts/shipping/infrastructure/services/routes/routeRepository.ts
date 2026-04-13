import { z } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  routeSchema,
  type RoutePrimitives,
} from "../../../domain/schemas/route/RouteDelivery";
import {
  findRoutesResponseSchema,
  type FindRoutesResponse,
} from "../../../application/route/FindRoutesResponse";
import type { CreateRouteRequest } from "../../../application/route/CreateRouteRequest";
import type { AssignDriverToRouteRequest } from "../../../application/route/AssignDriverToRouteRequest";
import type { FindRoutesRequest } from "../../../application/route/FindRoutesRequest";
import type { RecordDeliveryAttemptRequest } from "../../../application/route/RecordDeliveryAttemptRequest";

export const routeRepository = {
  create: async (request: CreateRouteRequest): Promise<RoutePrimitives> => {
    const data = await httpClient<unknown>("/route", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return routeSchema.parse(data);
  },

  assignDriver: async (
    request: AssignDriverToRouteRequest,
  ): Promise<RoutePrimitives> => {
    const { routeId, driverId } = request;
    const data = await httpClient<unknown>(`/route/${routeId}/driver`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });

    return routeSchema.parse(data);
  },

  optimize: async (routeId: string): Promise<RoutePrimitives> => {
    const data = await httpClient<unknown>(`/route/${routeId}/optimize`, {
      method: "POST",
    });

    return routeSchema.parse(data);
  },

  find: async (request: FindRoutesRequest = { filters: [] }): Promise<FindRoutesResponse> => {
    const data = await httpClient<unknown>("/route/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });

    return findRoutesResponseSchema.parse(data);
  },

  getById: async (routeId: string): Promise<RoutePrimitives> => {
    const data = await httpClient<unknown>(`/route/${routeId}`);
    return routeSchema.parse(data);
  },

  cancel: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}`, {
      method: "DELETE",
    });
  },

  getActiveForDriver: async (): Promise<RoutePrimitives | null> => {
    const data = await httpClient<unknown>("/driver/me/route/active");
    return z.nullable(routeSchema).parse(data);
  },

  start: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}/start`, {
      method: "POST",
    });
  },

  recordDeliveryAttempt: async (
    request: RecordDeliveryAttemptRequest,
  ): Promise<void> => {
    const { routeId, stopId, photo, ...body } = request;
    const formData = new FormData();

    formData.append("outcome", body.outcome);
    formData.append("photo", photo);
    formData.append("gpsLat", String(body.gpsLat));
    formData.append("gpsLng", String(body.gpsLng));
    formData.append("clientTimestamp", body.clientTimestamp);

    if (body.reason) {
      formData.append("reason", body.reason);
    }

    await httpClient<unknown>(`/route/${routeId}/stop/${stopId}/attempt`, {
      method: "POST",
      body: formData,
    });
  },

  complete: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}/complete`, {
      method: "POST",
    });
  },
};

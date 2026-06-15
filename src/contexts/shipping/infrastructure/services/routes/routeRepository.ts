import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { z } from "zod";
import type { CreateRouteRequest } from "../../../application/route/CreateRouteRequest";
import type { FindRoutesRequest } from "../../../application/route/FindRoutesRequest";
import {
  findRoutesResponseSchema,
  type FindRoutesResponse,
} from "../../../application/route/FindRoutesResponse";
import type { RecordDeliveryAttemptRequest } from "../../../application/route/RecordDeliveryAttemptRequest";
import {
  routeResponseSchema,
  type RouteResponsePrimitives,
} from "../../../application/route/RouteResponse";

export const routeRepository = {
  create: async (request: CreateRouteRequest): Promise<RouteResponsePrimitives> => {
    const data = await httpClient<unknown>("/route", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return routeResponseSchema.parse(data);
  },

  optimize: async (routeId: string): Promise<RouteResponsePrimitives> => {
    const data = await httpClient<unknown>(`/route/${routeId}/optimize`, {
      method: "POST",
    });

    return routeResponseSchema.parse(data);
  },

  find: async (request: FindRoutesRequest): Promise<FindRoutesResponse> => {
    const data = await httpClient<unknown>("/route/find", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return findRoutesResponseSchema.parse(data);
  },

  getById: async (routeId: string): Promise<RouteResponsePrimitives> => {
    const data = await httpClient<unknown>(`/route/${routeId}`);
    return routeResponseSchema.parse(data);
  },

  cancel: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}`, {
      method: "DELETE",
    });
  },

  getActiveForDriver: async (): Promise<RouteResponsePrimitives | null> => {
    const data = await httpClient<unknown>("/driver/me/route/active");
    return z.nullable(routeResponseSchema).parse(data);
  },

  start: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}/start`, {
      method: "POST",
    });
  },

  recordDeliveryAttempt: async (
    request: Omit<RecordDeliveryAttemptRequest, "driverId">,
  ): Promise<void> => {
    const { routeId, stopId, ...attemptData } = request;
    await httpClient<unknown>(`/route/${routeId}/stop/${stopId}/attempt`, {
      method: "POST",
      body: JSON.stringify(attemptData),
    });
  },

  complete: async (routeId: string): Promise<void> => {
    await httpClient<unknown>(`/route/${routeId}/complete`, {
      method: "POST",
    });
  },
};

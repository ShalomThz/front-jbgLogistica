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
  routeSchema,
  type RoutePrimitives,
} from "../../../domain/schemas/route/Route";

export const routeRepository = {
  create: async (request: CreateRouteRequest): Promise<RoutePrimitives> => {
    const data = await httpClient<unknown>("/route", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return routeSchema.parse(data);
  },

  optimize: async (routeId: string): Promise<RoutePrimitives> => {
    const data = await httpClient<unknown>(`/route/${routeId}/optimize`, {
      method: "POST",
    });

    return routeSchema.parse(data);
  },

  find: async (request: FindRoutesRequest): Promise<FindRoutesResponse> => {
    const data = await httpClient<unknown>("/route/find", {
      method: "POST",
      body: JSON.stringify({ ...request, filters: [] }),
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

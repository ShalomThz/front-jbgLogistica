import type {
  ZonePrimitives,
  FindZonesResponsePrimitives,
} from "../../../domain/schemas";
import { zoneSchema, findZonesResponseSchema } from "../../../domain/schemas";
import { httpClient } from "@/shared/infrastructure/http";

type CreateZoneRequest = Omit<ZonePrimitives, "id" | "createdAt" | "updatedAt">;
export type UpdateZoneRequest = Partial<CreateZoneRequest>;

export const zoneRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindZonesResponsePrimitives> => {
    const data = await httpClient<unknown>("/zone/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findZonesResponseSchema.parse(data);
  },

  create: async (zone: CreateZoneRequest): Promise<ZonePrimitives> => {
    const data = await httpClient<unknown>("/zone", {
      method: "POST",
      body: JSON.stringify(zone),
    });
    return zoneSchema.parse(data);
  },

  update: async (id: string, zone: UpdateZoneRequest): Promise<ZonePrimitives> => {
    const data = await httpClient<unknown>(`/zone/${id}`, {
      method: "PUT",
      body: JSON.stringify(zone),
    });
    return zoneSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/zone/${id}`, {
      method: "DELETE",
    });
  },
};

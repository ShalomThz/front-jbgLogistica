import {
  weightRateSchema,
  weightRatesResponseSchema,
  type CreateWeightRateRequest,
  type UpdateWeightRateRequest,
  type WeightRatePrimitives,
} from "@contexts/pricing/application/WeightRate";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const weightRateRepository = {
  find: async (zoneId?: string): Promise<WeightRatePrimitives[]> => {
    const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : "";
    const data = await httpClient<unknown>(`/weight-rate${query}`);

    return weightRatesResponseSchema.parse(data);
  },

  create: async (
    request: CreateWeightRateRequest,
  ): Promise<WeightRatePrimitives> => {
    const data = await httpClient<unknown>("/weight-rate", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return weightRateSchema.parse(data);
  },

  update: async (
    id: string,
    request: UpdateWeightRateRequest,
  ): Promise<WeightRatePrimitives> => {
    const data = await httpClient<unknown>(`/weight-rate/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });

    return weightRateSchema.parse(data);
  },

  remove: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/weight-rate/${id}`, { method: "DELETE" });
  },
};

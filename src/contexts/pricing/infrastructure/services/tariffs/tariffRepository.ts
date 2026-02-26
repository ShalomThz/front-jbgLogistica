import type { TariffPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffSchema } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { FindTariffsResponsePrimitives } from "@contexts/pricing/application/FindTariffsResponse";
import { findTariffsResponseSchema } from "@contexts/pricing/application/FindTariffsResponse";
import { httpClient } from "@contexts/shared/infrastructure/http";

export type CreateTariffRequest = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;
export type UpdateTariffRequest = CreateTariffRequest;

export const tariffRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindTariffsResponsePrimitives> => {
    const data = await httpClient<unknown>("/tariff/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findTariffsResponseSchema.parse(data);
  },

  create: async (tariff: CreateTariffRequest): Promise<TariffPrimitives> => {
    const data = await httpClient<unknown>("/tariff", {
      method: "POST",
      body: JSON.stringify(tariff),
    });
    return tariffSchema.parse(data);
  },

  update: async (id: string, tariff: UpdateTariffRequest): Promise<TariffPrimitives> => {
    const data = await httpClient<unknown>(`/tariff/${id}`, {
      method: "PUT",
      body: JSON.stringify(tariff),
    });
    return tariffSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/tariff/${id}`, {
      method: "DELETE",
    });
  },
};

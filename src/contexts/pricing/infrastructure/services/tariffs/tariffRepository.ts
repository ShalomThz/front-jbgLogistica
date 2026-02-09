import type {
  TariffPrimitives,
  FindTariffsResponsePrimitives,
} from "../../../domain/schemas";
import {
  tariffSchema,
  findTariffsResponseSchema,
} from "../../../domain/schemas";
import { httpClient } from "@/shared/infrastructure/http";

type CreateTariffRequest = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;
export type UpdateTariffRequest = Partial<CreateTariffRequest>;

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

import { findPackagesResponseSchema } from "@/contexts/warehouse/application/FindPackagesResponse";
import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const customerPackageRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number; order?: { field: string; direction: "ASC" | "DESC" } } = {},
  ): Promise<FindPackagesResponsePrimitives> => {
    const data = await httpClient<unknown>("/customer-warehouse/packages", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findPackagesResponseSchema.parse(data);
  },
};

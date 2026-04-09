import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import { boxSaleSchema } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import type { SellBoxRequestPrimitives } from "@contexts/inventory/application/SellBoxRequest";
import type { FindBoxSalesResponsePrimitives } from "@contexts/inventory/application/FindBoxSalesResponse";
import { findBoxSalesResponseSchema } from "@contexts/inventory/application/FindBoxSalesResponse";
import { httpClient, httpClientBlob } from "@contexts/shared/infrastructure/http";

export const boxSaleRepository = {
  sell: async (request: SellBoxRequestPrimitives): Promise<BoxSalePrimitives> => {
    const data = await httpClient<unknown>("/box-sale", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return boxSaleSchema.parse(data);
  },

  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindBoxSalesResponsePrimitives> => {
    const data = await httpClient<unknown>("/box-sale/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findBoxSalesResponseSchema.parse(data);
  },

  getReceipt: async (saleId: string): Promise<Blob> => {
    return httpClientBlob(`/box-sale/${saleId}/receipt`);
  },
};

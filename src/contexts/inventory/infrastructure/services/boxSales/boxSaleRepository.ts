import { ZodError } from "zod";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import { boxSaleSchema } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import type { SellBoxRequestPrimitives } from "@contexts/inventory/application/SellBoxRequest";
import type { FindBoxSalesResponsePrimitives } from "@contexts/inventory/application/FindBoxSalesResponse";
import { findBoxSalesResponseSchema } from "@contexts/inventory/application/FindBoxSalesResponse";
import { httpClient, httpClientBlob } from "@contexts/shared/infrastructure/http";

function parseBoxSale(data: unknown, context: string): BoxSalePrimitives {
  try {
    return boxSaleSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[boxSaleRepository] Parse error in ${context}:`, error.issues);
      console.error(`[boxSaleRepository] Raw data received:`, data);
    }
    throw error;
  }
}

function parseFindBoxSales(data: unknown): FindBoxSalesResponsePrimitives {
  try {
    return findBoxSalesResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[boxSaleRepository] Parse error in find:`, error.issues);
      console.error(`[boxSaleRepository] Raw data received:`, data);
    }
    throw error;
  }
}

export const boxSaleRepository = {
  sell: async (request: SellBoxRequestPrimitives): Promise<BoxSalePrimitives> => {
    const data = await httpClient<unknown>("/box-sale", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return parseBoxSale(data, "sell");
  },

  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindBoxSalesResponsePrimitives> => {
    const data = await httpClient<unknown>("/box-sale/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseFindBoxSales(data);
  },

  getReceipt: async (saleId: string): Promise<Blob> => {
    return httpClientBlob(`/box-sale/${saleId}/receipt`);
  },
};

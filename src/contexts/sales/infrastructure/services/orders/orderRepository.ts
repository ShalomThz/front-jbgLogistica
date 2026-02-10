import { httpClient } from "@/shared/infrastructure/http";
import type { OrderPrimitives, FindOrdersResponsePrimitives } from "../../../domain/schemas";
import { orderSchema, type CreateHQOrderRequest } from "../../../domain/schemas/order/Order";
import { findOrdersResponseSchema } from "../../../domain/schemas/order/FindOrdersResponse";

export const orderRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindOrdersResponsePrimitives> => {
    const data = await httpClient<unknown>("/order/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findOrdersResponseSchema.parse(data);
  },

  findById: async (id: string): Promise<OrderPrimitives> => {
    const data = await httpClient<unknown>(`/order/${id}`);
    return orderSchema.parse(data);
  },

  createHQ: async (order: CreateHQOrderRequest): Promise<OrderPrimitives> => {
    const data = await httpClient<unknown>("/order/hq", {
      method: "POST",
      body: JSON.stringify(order),
    });
    return orderSchema.parse(data);
  },
};

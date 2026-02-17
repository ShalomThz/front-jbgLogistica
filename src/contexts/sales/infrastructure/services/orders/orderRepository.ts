import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { orderSchema, type OrderPrimitives } from "../../../domain/schemas/order/Order";
import { findOrdersResponseSchema, type FindOrdersResponse } from "../../../application/order/FindOrderResponse";
import type { CreateHQOrderRequest } from "../../../application/order/CreateHQOrderRequest";
import type { CreatePartnerOrderRequest } from "../../../application/order/CreatePartnerOrderRequest";

export const orderRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindOrdersResponse> => {
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

  createPartner: async (
    order: CreatePartnerOrderRequest,
  ): Promise<OrderPrimitives> => {
    const data = await httpClient<unknown>("/order/partner", {
      method: "POST",
      body: JSON.stringify(order),
    });
    return orderSchema.parse(data);
  },
};

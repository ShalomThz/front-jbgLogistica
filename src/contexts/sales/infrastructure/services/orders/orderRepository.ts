import { ZodError } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { orderSchema, type OrderPrimitives } from "../../../domain/schemas/order/Order";
import { orderListViewSchema, type OrderListView } from "../../../domain/schemas/order/OrderListViewSchemas";
import { findOrdersResponseSchema, type FindOrdersResponse } from "../../../application/order/FindOrderResponse";
import type { CreateHQOrderRequest } from "../../../application/order/CreateHQOrderRequest";
import type { CreatePartnerOrderRequest } from "../../../application/order/CreatePartnerOrderRequest";
import type { EditOrderRequest } from "../../../application/order/EditOrderRequest";

function parseOrder(data: unknown, context: string): OrderPrimitives {
  try {
    return orderSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[orderRepository] Parse error in ${context}:`, error.issues);
      console.error(`[orderRepository] Raw data received:`, data);
    }
    throw error;
  }
}

function parseFindOrders(data: unknown): FindOrdersResponse {
  try {
    return findOrdersResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[orderRepository] Parse error in find:`, error.issues);
      console.error(`[orderRepository] Raw data received:`, data);
    }
    throw error;
  }
}

export const orderRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindOrdersResponse> => {
    const data = await httpClient<unknown>("/order/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseFindOrders(data);
  },

  findById: async (id: string): Promise<OrderListView> => {
    const data = await httpClient<unknown>(`/order/${id}`);
    try {
      return orderListViewSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`[orderRepository] Parse error in findById(${id}):`, error.issues);
        console.error(`[orderRepository] Raw data received:`, data);
      }
      throw error;
    }
  },

  createHQ: async (order: CreateHQOrderRequest): Promise<OrderPrimitives> => {
    const data = await httpClient<unknown>("/order/hq", {
      method: "POST",
      body: JSON.stringify(order),
    });
    return parseOrder(data, "createHQ");
  },

  update: async (id: string, order: EditOrderRequest): Promise<void> => {
    await httpClient<unknown>(`/order/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  },

  createPartner: async (
    order: CreatePartnerOrderRequest,
  ): Promise<OrderPrimitives> => {
    const data = await httpClient<unknown>("/order/partner", {
      method: "POST",
      body: JSON.stringify(order),
    });
    return parseOrder(data, "createPartner");
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/order/${id}`, {
      method: "DELETE",
    });
  },

};

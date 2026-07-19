import { httpClient, httpClientBlob } from "@contexts/shared/infrastructure/http/httpClient";
import { ZodError } from "zod";
import type { AddPaymentRequest } from "../../../application/order/AddPaymentRequest";
import type { CreateHQOrderRequest } from "../../../application/order/CreateHQOrderRequest";
import type { CreatePartnerOrderRequest } from "../../../application/order/CreatePartnerOrderRequest";
import type { EditOrderRequest } from "../../../application/order/EditOrderRequest";
import { findOrdersResponseSchema, type FindOrdersResponse } from "../../../application/order/FindOrderResponse";
import type { FindOrdersRequest } from "../../../application/order/FindOrdersRequest";
import type { OrderReportResponse } from "../../../application/order/OrderReportResponse";
import {
  orderListViewResponseSchema,
  orderResponseSchema,
  type OrderListViewResponse,
  type OrderResponsePrimitives,
} from "../../../application/order/OrderResponse";

function parseOrder(data: unknown, context: string): OrderResponsePrimitives {
  try {
    return orderResponseSchema.parse(data);
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
    request: Partial<FindOrdersRequest> = {},
  ): Promise<FindOrdersResponse> => {
    const data = await httpClient<unknown>("/order/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseFindOrders(data);
  },

  findById: async (id: string): Promise<OrderListViewResponse> => {
    const data = await httpClient<unknown>(`/order/${id}`);
    try {
      return orderListViewResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`[orderRepository] Parse error in findById(${id}):`, error.issues);
        console.error(`[orderRepository] Raw data received:`, data);
      }
      throw error;
    }
  },

  createHQ: async (order: CreateHQOrderRequest): Promise<OrderResponsePrimitives> => {
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
  ): Promise<OrderResponsePrimitives> => {
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

  addPayment: async (
    id: string,
    payment: AddPaymentRequest,
  ): Promise<void> => {
    await httpClient<unknown>(`/order/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(payment),
    });
  },

  removePayment: async (id: string, paymentId: string): Promise<void> => {
    await httpClient<unknown>(`/order/${id}/payment/${paymentId}`, {
      method: "DELETE",
    });
  },

  clearPayments: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/order/${id}/payments`, {
      method: "DELETE",
    });
  },

  report: async (
    request: Partial<Pick<FindOrdersRequest, "filters" | "search">> & { currency?: string } = {},
  ): Promise<OrderReportResponse> => {
    return httpClient<OrderReportResponse>("/order/report", {
      method: "POST",
      body: JSON.stringify({
        filters: request.filters ?? [],
        search: request.search,
        currency: request.currency ?? "USD",
      }),
    });
  },

  getInvoicePdf: async (orderId: string): Promise<Blob> => {
    return httpClientBlob(`/invoice/${orderId}/pdf`);
  },
};

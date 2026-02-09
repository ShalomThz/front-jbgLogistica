import { httpClient } from "@/shared/infrastructure/http";
import type {
  OrderPrimitives
} from "../../../domain/schemas";
import { orderSchema, type CreateHQOrderRequest } from "../../../domain/schemas/order/Order";

export type UpdateOrderRequest = Partial<CreateHQOrderRequest>;

export const orderRepository = {
  createHQ: async (order: CreateHQOrderRequest): Promise<OrderPrimitives> => {
    const data = await httpClient<OrderPrimitives>("/order/hq", {
      method: "POST",
      body: JSON.stringify(order),
    });

    return orderSchema.parse(data);
  },
};

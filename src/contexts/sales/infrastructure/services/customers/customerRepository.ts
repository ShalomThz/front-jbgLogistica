import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { customerSchema, type CustomerPrimitives, type CreateCustomerRequest } from "../../../domain/schemas/customer/Customer";
import { findCustomersResponseSchema, type FindCustomersResponsePrimitives } from "../../../application/customer/FindCustomersResponse";

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface ProvisionAccessResponse {
  customerId: string;
  userId: string;
  email: string;
  isNew: boolean;
}

export const customerRepository = {
  find: async (
    request: { filters: unknown[]; limit?: number; offset?: number },
  ): Promise<FindCustomersResponsePrimitives> => {
    const data = await httpClient<unknown>("/customer/find", {
      method: "POST",
      body: JSON.stringify({ ...request }),
    });
    return findCustomersResponseSchema.parse(data);
  },

  create: async (customer: CreateCustomerRequest): Promise<CustomerPrimitives> => {
    const data = await httpClient<unknown>("/customer", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    return customerSchema.parse(data);
  },

  update: async (id: string, customer: UpdateCustomerRequest): Promise<CustomerPrimitives> => {
    const data = await httpClient<unknown>(`/customer/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    });
    return customerSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/customer/${id}`, {
      method: "DELETE",
    });
  },

  provisionAccess: async (id: string, password: string): Promise<ProvisionAccessResponse> => {
    const data = await httpClient<unknown>(`/customer/${id}/provision-access`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return data as ProvisionAccessResponse;
  },
};

import { ZodError } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { customerSchema, type CustomerPrimitives, type CreateCustomerRequest } from "../../../domain/schemas/customer/Customer";
import { findCustomersResponseSchema, type FindCustomersResponsePrimitives } from "../../../application/customer/FindCustomersResponse";
import type { FindCustomersRequest } from "../../../application/customer/FindCustomersRequest";

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface ProvisionAccessResponse {
  customerId: string;
  userId: string;
  email: string;
  isNew: boolean;
}

function parseFindCustomers(data: unknown): FindCustomersResponsePrimitives {
  try {
    const parsed = findCustomersResponseSchema.parse(data);
    console.log(
      `[customerRepository] find parsed ok — ${parsed.data.length} item(s), total=${parsed.pagination.total}`,
    );
    return parsed;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[customerRepository] Parse error in find:`, error.issues);
      console.error(`[customerRepository] Raw data received:`, data);
    }
    throw error;
  }
}

function parseCustomer(data: unknown, context: string): CustomerPrimitives {
  try {
    return customerSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[customerRepository] Parse error in ${context}:`, error.issues);
      console.error(`[customerRepository] Raw data received:`, data);
    }
    throw error;
  }
}

export const customerRepository = {
  find: async (
    request: Partial<FindCustomersRequest> = {},
  ): Promise<FindCustomersResponsePrimitives> => {
    const data = await httpClient<unknown>("/customer/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseFindCustomers(data);
  },

  create: async (customer: CreateCustomerRequest): Promise<CustomerPrimitives> => {
    const data = await httpClient<unknown>("/customer", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    return parseCustomer(data, "create");
  },

  update: async (id: string, customer: UpdateCustomerRequest): Promise<CustomerPrimitives> => {
    const data = await httpClient<unknown>(`/customer/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    });
    return parseCustomer(data, `update(${id})`);
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

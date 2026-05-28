import {
  storeListViewResponseSchema,
  storeResponseSchema,
  type StoreListViewResponsePrimitives,
  type StoreResponsePrimitives,
} from "@contexts/iam/application/store/StoreResponse";
import type { CreateStoreRequestPrimitives } from "@contexts/iam/application/store/CreateStoreRequest";
import type { FindStoresRequestPrimitives } from "@contexts/iam/application/store/FindStoresRequest";
import type { FindStoresResponsePrimitives } from "@contexts/iam/application/store/FindStoresResponse";
import { findStoresResponseSchema } from "@contexts/iam/application/store/FindStoresResponse";
import { httpClient } from "@contexts/shared/infrastructure/http";

export type UpdateStoreRequest = Partial<CreateStoreRequestPrimitives>;

export const storeRepository = {
  find: async (
    request: Partial<FindStoresRequestPrimitives> = {},
  ): Promise<FindStoresResponsePrimitives> => {
    const data = await httpClient<unknown>("/store/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findStoresResponseSchema.parse(data);
  },

  getById: async (id: string): Promise<StoreListViewResponsePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`);
    return storeListViewResponseSchema.parse(data);
  },

  create: async (
    store: CreateStoreRequestPrimitives,
  ): Promise<StoreResponsePrimitives> => {
    const data = await httpClient<unknown>("/store", {
      method: "POST",
      body: JSON.stringify(store),
    });
    return storeResponseSchema.parse(data);
  },

  update: async (
    id: string,
    store: UpdateStoreRequest,
  ): Promise<StoreResponsePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`, {
      method: "PUT",
      body: JSON.stringify(store),
    });
    return storeResponseSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/store/${id}`, {
      method: "DELETE",
    });
  },
};

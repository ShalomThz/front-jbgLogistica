import type { StorePrimitives } from "@contexts/iam/domain/schemas/store/Store";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";
import { storeListViewSchema } from "@contexts/iam/domain/schemas/store/StoreListView";
import type { CreateStoreRequestPrimitives } from "@contexts/iam/application/store/CreateStoreRequest";
import type { FindStoresRequestPrimitives } from "@contexts/iam/application/store/FindStoresRequest";
import type { FindStoresResponsePrimitives } from "@contexts/iam/application/store/FindStoresResponse";
import { findStoresResponseSchema } from "@contexts/iam/application/store/FindStoresResponse";
import { httpClient } from "@contexts/shared/infrastructure/http";

export type UpdateStoreRequest = Partial<CreateStoreRequestPrimitives>;

export const storeRepository = {
  find: async (
    request: FindStoresRequestPrimitives,
  ): Promise<FindStoresResponsePrimitives> => {
    const data = await httpClient<unknown>("/store/find", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return findStoresResponseSchema.parse(data);
  },

  getById: async (id: string): Promise<StoreListViewPrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`);
    return storeListViewSchema.parse(data);
  },

  create: async (
    store: CreateStoreRequestPrimitives,
  ): Promise<StorePrimitives> => {
    const data = await httpClient<unknown>("/store", {
      method: "POST",
      body: JSON.stringify(store),
    });
    return storeSchema.parse(data);
  },

  update: async (
    id: string,
    store: UpdateStoreRequest,
  ): Promise<StorePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`, {
      method: "PUT",
      body: JSON.stringify(store),
    });
    return storeSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/store/${id}`, {
      method: "DELETE",
    });
  },
};

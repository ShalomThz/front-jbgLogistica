import type {
  StorePrimitives,
  CreateStoreRequestPrimitives,
  FindStoresRequestPrimitives,
  FindStoresResponsePrimitives,
} from "../../../domain/schemas/store";
import {
  storeSchema,
  findStoresResponseSchema,
} from "../../../domain/schemas/store";
import { httpClient } from "@/shared/infrastructure/http";

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

  getById: async (id: string): Promise<StorePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`);
    return storeSchema.parse(data);
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

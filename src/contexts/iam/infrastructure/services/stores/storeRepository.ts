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
import type { z } from "zod";

export type UpdateStoreRequest = Partial<CreateStoreRequestPrimitives>;

/**
 * Valida con el schema y, si falla, deja en consola qué campo vino mal antes de
 * propagar el error. Sin esto un `parse` directo tira "expected string,
 * received undefined" sin decir de qué llamada salió — que es exactamente lo
 * que cuesta rastrear cuando un campo nuevo todavía no está en los documentos.
 */
function parseOrLog<T extends z.ZodType>(
  schema: T,
  data: unknown,
  operation: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(
      `[storeRepository] ${operation}: respuesta inválida`,
      result.error.issues,
    );
    throw result.error;
  }
  return result.data;
}

export const storeRepository = {
  find: async (
    request: Partial<FindStoresRequestPrimitives> = {},
  ): Promise<FindStoresResponsePrimitives> => {
    const data = await httpClient<unknown>("/store/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseOrLog(findStoresResponseSchema, data, "find");
  },

  getById: async (id: string): Promise<StoreListViewResponsePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`);
    return parseOrLog(storeListViewResponseSchema, data, `getById(${id})`);
  },

  create: async (
    store: CreateStoreRequestPrimitives,
  ): Promise<StoreResponsePrimitives> => {
    const data = await httpClient<unknown>("/store", {
      method: "POST",
      body: JSON.stringify(store),
    });
    return parseOrLog(storeResponseSchema, data, "create");
  },

  update: async (
    id: string,
    store: UpdateStoreRequest,
  ): Promise<StoreResponsePrimitives> => {
    const data = await httpClient<unknown>(`/store/${id}`, {
      method: "PUT",
      body: JSON.stringify(store),
    });
    return parseOrLog(storeResponseSchema, data, `update(${id})`);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/store/${id}`, {
      method: "DELETE",
    });
  },
};

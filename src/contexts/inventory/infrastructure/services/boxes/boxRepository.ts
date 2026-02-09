import type {
  BoxPrimitives,
  CreateBoxRequestPrimitives,
  FindBoxesResponsePrimitives,
} from "../../../domain";
import { boxSchema, findBoxesResponseSchema } from "../../../domain";
import { httpClient } from "@/shared/infrastructure/http";

export type UpdateBoxRequest = Partial<CreateBoxRequestPrimitives>;

export const boxRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number } = {},
  ): Promise<FindBoxesResponsePrimitives> => {
    const data = await httpClient<unknown>("/box/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findBoxesResponseSchema.parse(data);
  },

  getById: async (id: string): Promise<BoxPrimitives> => {
    const data = await httpClient<unknown>(`/box/${id}`);
    return boxSchema.parse(data);
  },

  create: async (box: CreateBoxRequestPrimitives): Promise<BoxPrimitives> => {
    const data = await httpClient<unknown>("/box", {
      method: "POST",
      body: JSON.stringify(box),
    });
    return boxSchema.parse(data);
  },

  update: async (id: string, box: UpdateBoxRequest): Promise<BoxPrimitives> => {
    const data = await httpClient<unknown>(`/box/${id}`, {
      method: "PUT",
      body: JSON.stringify(box),
    });
    return boxSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/box/${id}`, {
      method: "DELETE",
    });
  },
};

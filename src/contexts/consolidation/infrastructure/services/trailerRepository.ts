import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import type { Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import {
  createTrailerRequestSchema,
  findTrailersResponseSchema,
  trailerSchema,
  updateTrailerRequestSchema,
  type CreateTrailerRequest,
  type FindTrailersResponse,
  type TrailerPrimitives,
  type UpdateTrailerRequest,
} from "@contexts/consolidation/domain/schemas/trailer/Trailer";

interface FindTrailersRequest {
  filters?: Filter[];
  limit?: number;
  offset?: number;
  search?: string;
}

export const trailerRepository = {
  find: async (
    request: FindTrailersRequest = {},
  ): Promise<FindTrailersResponse> => {
    const data = await httpClient<unknown>("/trailer/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findTrailersResponseSchema.parse(data);
  },

  create: async (request: CreateTrailerRequest): Promise<TrailerPrimitives> => {
    const payload = createTrailerRequestSchema.parse(request);
    const data = await httpClient<unknown>("/trailer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return trailerSchema.parse(data);
  },

  update: async (
    id: string,
    request: UpdateTrailerRequest,
  ): Promise<TrailerPrimitives> => {
    const payload = updateTrailerRequestSchema.parse(request);
    const data = await httpClient<unknown>(`/trailer/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return trailerSchema.parse(data);
  },
};

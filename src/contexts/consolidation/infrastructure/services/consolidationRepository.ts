import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import {
  addOrdersToConsolidationRequestSchema,
  addOrdersToConsolidationResponseSchema,
  consolidationSchema,
  consolidationStatsSchema,
  createConsolidationRequestSchema,
  createConsolidationResponseSchema,
  type CreateConsolidationResponse,
  findConsolidationsResponseSchema,
  getConsolidationResponseSchema,
  updateConsolidationDetailsRequestSchema,
  updateConsolidationOrderCommentsRequestSchema,
  type AddOrdersToConsolidationRequest,
  type AddOrdersToConsolidationResponse,
  type ConsolidationPrimitives,
  type ConsolidationStats,
  type CreateConsolidationRequest,
  type FindConsolidationsResponse,
  type GetConsolidationResponse,
  type UpdateConsolidationDetailsRequest,
  type UpdateConsolidationOrderCommentsRequest,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";

interface FindConsolidationsRequest {
  filters?: Filter[];
  order?: { field: string; direction: Direction };
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Todas las llamadas HTTP del feature viven acá, igual que
 * `routeRepository`/`driverRepository`. `GET /consolidation/:id` regresa una
 * vista enriquecida (consolidado + conductor + tráiler + órdenes con
 * cliente/destino + historial) armada con joins al momento de la consulta —
 * no es el agregado plano, por eso tiene su propio schema
 * (`GetConsolidationResponse`).
 */
export const consolidationRepository = {
  find: async (
    request: FindConsolidationsRequest = {},
  ): Promise<FindConsolidationsResponse> => {
    const data = await httpClient<unknown>("/consolidation/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findConsolidationsResponseSchema.parse(data);
  },

  stats: async (): Promise<ConsolidationStats> => {
    const data = await httpClient<unknown>("/consolidation/stats");
    return consolidationStatsSchema.parse(data);
  },

  getById: async (id: string): Promise<GetConsolidationResponse> => {
    const data = await httpClient<unknown>(`/consolidation/${id}`);
    return getConsolidationResponseSchema.parse(data);
  },

  create: async (
    request: CreateConsolidationRequest,
  ): Promise<CreateConsolidationResponse> => {
    const payload = createConsolidationRequestSchema.parse(request);
    const data = await httpClient<unknown>("/consolidation", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return createConsolidationResponseSchema.parse(data);
  },

  updateDetails: async (
    id: string,
    request: UpdateConsolidationDetailsRequest,
  ): Promise<ConsolidationPrimitives> => {
    const payload = updateConsolidationDetailsRequestSchema.parse(request);
    const data = await httpClient<unknown>(`/consolidation/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return consolidationSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/consolidation/${id}`, { method: "DELETE" });
  },

  addOrders: async (
    id: string,
    request: AddOrdersToConsolidationRequest,
  ): Promise<AddOrdersToConsolidationResponse> => {
    const payload = addOrdersToConsolidationRequestSchema.parse(request);
    const data = await httpClient<unknown>(`/consolidation/${id}/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return addOrdersToConsolidationResponseSchema.parse(data);
  },

  removeOrder: async (
    id: string,
    orderId: string,
  ): Promise<ConsolidationPrimitives> => {
    const data = await httpClient<unknown>(
      `/consolidation/${id}/orders/${orderId}`,
      { method: "DELETE" },
    );
    return consolidationSchema.parse(data);
  },

  updateOrderComments: async (
    id: string,
    request: UpdateConsolidationOrderCommentsRequest,
  ): Promise<ConsolidationPrimitives> => {
    const payload = updateConsolidationOrderCommentsRequestSchema.parse(request);
    const data = await httpClient<unknown>(
      `/consolidation/${id}/orders/comments`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    return consolidationSchema.parse(data);
  },

  advanceStage: async (id: string): Promise<ConsolidationPrimitives> => {
    const data = await httpClient<unknown>(
      `/consolidation/${id}/advance-stage`,
      { method: "POST" },
    );
    return consolidationSchema.parse(data);
  },

  attachEvidence: async (
    id: string,
    photos: File[],
  ): Promise<ConsolidationPrimitives> => {
    const formData = new FormData();
    photos.forEach((photo) => formData.append("photos", photo));
    const data = await httpClient<unknown>(`/consolidation/${id}/evidence`, {
      method: "POST",
      body: formData,
    });
    return consolidationSchema.parse(data);
  },
};

import type { TariffPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffSchema } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { FindTariffsResponsePrimitives } from "@contexts/pricing/application/FindTariffsResponse";
import { findTariffsResponseSchema } from "@contexts/pricing/application/FindTariffsResponse";
import type { FindTariffsRequestPrimitives } from "@contexts/pricing/application/FindTariffsRequest";
import type { QuotePriceRequest, QuotePriceResponse } from "@contexts/pricing/application/QuotePrice";
import { quotePriceResponseSchema } from "@contexts/pricing/application/QuotePrice";
import type { SetZonePriceRequest, ZonePriceMatrix } from "@contexts/pricing/application/ZonePriceMatrix";
import { zonePriceMatrixSchema } from "@contexts/pricing/application/ZonePriceMatrix";
import { httpClient } from "@contexts/shared/infrastructure/http";
import { z } from "zod";

export type CreateTariffRequest = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;
export type UpdateTariffRequest = CreateTariffRequest;

export const tariffRepository = {
  find: async (
    request: Partial<FindTariffsRequestPrimitives> = {},
  ): Promise<FindTariffsResponsePrimitives> => {
    const data = await httpClient<unknown>("/tariff/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findTariffsResponseSchema.parse(data);
  },

  create: async (tariff: CreateTariffRequest): Promise<TariffPrimitives> => {
    const data = await httpClient<unknown>("/tariff", {
      method: "POST",
      body: JSON.stringify(tariff),
    });
    return tariffSchema.parse(data);
  },

  update: async (id: string, tariff: UpdateTariffRequest): Promise<TariffPrimitives> => {
    const data = await httpClient<unknown>(`/tariff/${id}`, {
      method: "PUT",
      body: JSON.stringify(tariff),
    });
    return tariffSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/tariff/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Cotiza: se manda dónde se recoge la caja y el servidor resuelve la zona y
   * el renglón de la tabla. El front ya no arma la clave de precio a mano.
   */
  quote: async (request: QuotePriceRequest): Promise<QuotePriceResponse> => {
    const data = await httpClient<unknown>("/tariff/quote", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return quotePriceResponseSchema.parse(data);
  },

  /** La zona como tabla: caja × servicio con los dos precios. */
  matrix: async (zoneId: string): Promise<ZonePriceMatrix> => {
    const data = await httpClient<unknown>(`/tariff/matrix/${zoneId}`);
    return zonePriceMatrixSchema.parse(data);
  },

  /** Escribe la celda completa: público y socio en un solo comando. */
  setZonePrice: async (request: SetZonePriceRequest): Promise<TariffPrimitives[]> => {
    const data = await httpClient<unknown>("/tariff/matrix", {
      method: "PUT",
      body: JSON.stringify(request),
    });
    return z.array(tariffSchema).parse(data);
  },
};

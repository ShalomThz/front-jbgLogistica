import {
  weightRatesResponseSchema,
  type SetZoneWeightRateRequest,
  type WeightRatePrimitives,
} from "@contexts/pricing/application/WeightRate";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const weightRateRepository = {
  find: async (zoneId?: string): Promise<WeightRatePrimitives[]> => {
    const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : "";
    const data = await httpClient<unknown>(`/weight-rate${query}`);

    return weightRatesResponseSchema.parse(data);
  },

  /**
   * Escribe la celda entera: público y socio en un solo comando.
   *
   * Es el único camino de escritura desde el front. Los endpoints por fila
   * (`POST /weight-rate`, `PUT`/`DELETE /weight-rate/:id`) siguen existiendo en
   * el servidor, pero permiten que las dos mitades de una celda queden con
   * distinta unidad o moneda —la llave única no las incluye— y la matriz no
   * sabe representar eso: muestra una sola y la pisa al guardar.
   */
  setZoneWeightRate: async (
    request: SetZoneWeightRateRequest,
  ): Promise<WeightRatePrimitives[]> => {
    const data = await httpClient<unknown>("/weight-rate/matrix", {
      method: "PUT",
      body: JSON.stringify(request),
    });

    return weightRatesResponseSchema.parse(data);
  },
};

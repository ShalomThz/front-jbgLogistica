import {
  volumetricDivisorSchema,
  type SaveVolumetricDivisorRequest,
  type VolumetricDivisor,
} from "@contexts/settings/application/VolumetricDivisor";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const volumetricDivisorRepository = {
  get: async (): Promise<VolumetricDivisor> => {
    const data = await httpClient<unknown>("/settings/volumetric-divisor");

    return volumetricDivisorSchema.parse(data);
  },

  save: async (data: SaveVolumetricDivisorRequest): Promise<void> => {
    await httpClient<unknown>("/settings/volumetric-divisor", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

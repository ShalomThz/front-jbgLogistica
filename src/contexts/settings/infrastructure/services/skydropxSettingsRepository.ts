import {
  hqSkydropxAddressResponseSchema,
  type HQSkydropxAddressResponse,
} from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import type { SaveSkydropxAddressRequest } from "@contexts/settings/domain/schemas/SaveSkydropxAddressRequest";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const skydropxSettingsRepository = {
  getAddress: async (): Promise<HQSkydropxAddressResponse> =>
    hqSkydropxAddressResponseSchema.parse(
      await httpClient<unknown>("/settings/skydropx-address"),
    ),

  saveAddress: async (data: SaveSkydropxAddressRequest): Promise<void> => {
    await httpClient<unknown>("/settings/skydropx-address", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

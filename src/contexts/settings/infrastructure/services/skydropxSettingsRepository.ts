import {
  hqSkydropxAddressesResponseSchema,
  type HQSkydropxAddressesResponse,
} from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import type { SaveSkydropxAddressesRequest } from "@contexts/settings/domain/schemas/SaveSkydropxAddressRequest";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const skydropxSettingsRepository = {
  getAddresses: async (): Promise<HQSkydropxAddressesResponse> => {
    const data =
      await httpClient<unknown>("/settings/skydropx-address");

    return hqSkydropxAddressesResponseSchema.parse({
      skydropxAddresses: data
    })
  },

  saveAddresses: async (data: SaveSkydropxAddressesRequest): Promise<void> => {
    await httpClient<unknown>("/settings/skydropx-address", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

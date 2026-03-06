import {
  hqSkydropxAddressSchema,
  type HQSkydropxAddressPrimitives,
  type SaveSkydropxAddressRequest
} from "@contexts/settings/domain/schemas/SkydropxAddressSchema";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const skydropxSettingsRepository = {
  getAddress: async (): Promise<HQSkydropxAddressPrimitives> =>
    hqSkydropxAddressSchema.parse(
      await httpClient<unknown>("/settings/skydropx-address"),
    ),

  saveAddress: async (data: SaveSkydropxAddressRequest): Promise<void> => {
    await httpClient<unknown>("/settings/skydropx-address", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

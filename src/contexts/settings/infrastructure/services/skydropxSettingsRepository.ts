import { httpClient } from "@contexts/shared/infrastructure/http";
import {
  getSkydropxAddressResponseSchema,
  type GetSkydropxAddressResponse,
  type SkydropxAddressFromPrimitives,
} from "@contexts/settings/domain/schemas/SkydropxAddressSchema";

export const skydropxSettingsRepository = {
  getAddress: async (): Promise<GetSkydropxAddressResponse> =>
    getSkydropxAddressResponseSchema.parse(
      await httpClient<unknown>("/settings/skydropx-address"),
    ),

  saveAddress: async (data: SkydropxAddressFromPrimitives): Promise<void> => {
    await httpClient<unknown>("/settings/skydropx-address", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

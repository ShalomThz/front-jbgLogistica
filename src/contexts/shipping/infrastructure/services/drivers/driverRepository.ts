import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  driverSchema,
  type DriverPrimitives,
} from "../../../domain/schemas/driver/Driver";
import {
  findDriversResponseSchema,
  type FindDriversResponse,
} from "../../../application/driver/FindDriversResponse";
import type { CreateDriverRequest } from "../../../application/driver/CreateDriverRequest";
import type { EditDriverRequest } from "../../../application/driver/EditDriverRequest";
import type { FindDriversRequest } from "../../../application/driver/FindDriversRequest";

export const driverRepository = {
  create: async (request: CreateDriverRequest): Promise<DriverPrimitives> => {
    const data = await httpClient<unknown>("/driver", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return driverSchema.parse(data);
  },

  update: async (id: string, data: EditDriverRequest): Promise<void> => {
    await httpClient<unknown>(`/driver/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  find: async (
    request: FindDriversRequest = { filters: [] },
  ): Promise<FindDriversResponse> => {
    const data = await httpClient<unknown>("/driver/find", {
      method: "POST",
      body: JSON.stringify({ ...request }),
    });

    return findDriversResponseSchema.parse(data);
  },
};

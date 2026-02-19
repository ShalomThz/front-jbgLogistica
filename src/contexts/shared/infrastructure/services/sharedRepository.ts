import { z } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { findCountriesRequestSchema, type FindCountriesRequest } from "@contexts/shared/domain/schemas/address/Country";

const countriesResponseSchema = z.record(z.string(), z.string());

export type CountriesResponse = z.infer<typeof countriesResponseSchema>;

export const sharedRepository = {
  findCountries: async (request: FindCountriesRequest = {}): Promise<CountriesResponse> => {
    const { search } = findCountriesRequestSchema.parse(request);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await httpClient<unknown>(`/countries${params}`, { method: "POST" });
    return countriesResponseSchema.parse(data);
  },
};

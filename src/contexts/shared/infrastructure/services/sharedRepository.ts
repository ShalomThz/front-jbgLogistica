import { z } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { findCountriesRequestSchema, type FindCountriesRequest } from "@contexts/shared/domain/schemas/address/Country";
import { autocompleteResponseSchema, type AutocompleteResponse } from "@contexts/shared/domain/schemas/address/AutocompleteResponse";
import { placeDetailsResponseSchema, type PlaceDetailsResponse } from "@contexts/shared/domain/schemas/address/PlaceDetailsResponse";

const countriesResponseSchema = z.record(z.string(), z.string());

export type CountriesResponse = z.infer<typeof countriesResponseSchema>;

export const sharedRepository = {
  findCountries: async (request: FindCountriesRequest = {}): Promise<CountriesResponse> => {
    const { search } = findCountriesRequestSchema.parse(request);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await httpClient<unknown>(`/countries${params}`, { method: "POST" });
    return countriesResponseSchema.parse(data);
  },

  autocomplete: async (input: string): Promise<AutocompleteResponse> => {
    const data = await httpClient<unknown>("/address/autocomplete", {
      method: "POST",
      body: JSON.stringify({ input }),
    });
    return autocompleteResponseSchema.parse(data);
  },

  placeDetails: async (placeId: string): Promise<PlaceDetailsResponse> => {
    const data = await httpClient<unknown>("/address/place-details", {
      method: "POST",
      body: JSON.stringify({ place_id: placeId }),
    });
    return placeDetailsResponseSchema.parse(data);
  },
};

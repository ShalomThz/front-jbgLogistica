import { z } from "zod";
import { geolocationSchema } from "./Geolocation";

export const placeDetailsResponseSchema = z.object({
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  province: z.string(),
  zip: z.string(),
  country: z.string(),
  geolocation: geolocationSchema,
});

export type PlaceDetailsResponse = z.infer<typeof placeDetailsResponseSchema>;

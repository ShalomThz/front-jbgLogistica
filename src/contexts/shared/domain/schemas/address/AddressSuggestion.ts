import { z } from "zod";

const suggestionTypes = ["place", "business"] as const;

export const addressSuggestionSchema = z.object({
  placeId: z.string(),
  description: z.string(),
  mainText: z.string(),
  secondaryText: z.string(),
  type: z.enum(suggestionTypes),
});

export type AddressSuggestionPrimitives = z.infer<typeof addressSuggestionSchema>;

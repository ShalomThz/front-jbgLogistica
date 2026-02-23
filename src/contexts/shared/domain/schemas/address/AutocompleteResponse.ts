import { z } from "zod";
import { addressSuggestionSchema } from "./AddressSuggestion";

export const autocompleteResponseSchema = z.object({
  success: z.boolean(),
  suggestions: z.array(addressSuggestionSchema),
});

export type AutocompleteResponse = z.infer<typeof autocompleteResponseSchema>;

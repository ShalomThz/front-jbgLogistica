import { z } from "zod";

// Solo el nombre, que es lo que se guarda en la zona. Es un objeto y no un
// string suelto a propósito: si algún día hace falta el código ISO del estado,
// se agrega un campo y no rompe a nadie.
export const stateSuggestionSchema = z.object({
  name: z.string(),
});

export type StateSuggestion = z.infer<typeof stateSuggestionSchema>;

export const searchStatesResponseSchema = z.object({
  states: z.array(stateSuggestionSchema),
});

export type SearchStatesResponse = z.infer<typeof searchStatesResponseSchema>;

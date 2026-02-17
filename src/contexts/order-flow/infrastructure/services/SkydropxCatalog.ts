import { z } from "zod";

export const skydropxCatalogItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    code: z.string(),
  }),
});

export type SkydropxCatalogItem = z.infer<typeof skydropxCatalogItemSchema>;

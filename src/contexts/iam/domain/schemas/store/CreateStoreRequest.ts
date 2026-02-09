import { z } from "zod";
import { storeSchema } from "./Store";

export const createStoreRequestSchema = storeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateStoreRequestPrimitives = z.infer<typeof createStoreRequestSchema>;

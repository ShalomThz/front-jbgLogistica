import { z } from "zod";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findStoresResponseSchema = z.object({
  data: z.array(storeSchema),
  pagination: paginationSchema,
});

export type FindStoresResponsePrimitives = z.infer<
  typeof findStoresResponseSchema
>;

import { z } from "zod";

export const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type PaginationPrimitives = z.infer<typeof paginationSchema>;

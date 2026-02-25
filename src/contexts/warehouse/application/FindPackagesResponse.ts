import { z } from "zod";
import { packageListViewSchema } from "@/contexts/warehouse/domain/WarehousePackageSchema";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findPackagesResponseSchema = z.object({
  data: z.array(packageListViewSchema),
  pagination: paginationSchema,
});

export type FindPackagesResponsePrimitives = z.infer<typeof findPackagesResponseSchema>;

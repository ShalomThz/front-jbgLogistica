import { z } from "zod";
import { tariffSchema } from "@contexts/pricing/domain/schemas/tariff/Tariff";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findTariffsResponseSchema = z.object({
  data: z.array(tariffSchema),
  pagination: paginationSchema,
});

export type FindTariffsResponsePrimitives = z.infer<typeof findTariffsResponseSchema>;

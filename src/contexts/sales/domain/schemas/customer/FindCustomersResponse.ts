import { z } from "zod";
import { customerSchema } from "./Customer";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findCustomersResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: paginationSchema,
});

export type FindCustomersResponsePrimitives = z.infer<typeof findCustomersResponseSchema>;

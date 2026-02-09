import { z } from "zod";
import { userSchema } from "./User";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findUsersResponseSchema = z.object({
  data: z.array(userSchema),
  pagination: paginationSchema,
});

export type FindUsersResponsePrimitives = z.infer<
  typeof findUsersResponseSchema
>;

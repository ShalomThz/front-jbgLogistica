import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import { z } from "zod";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findUsersResponseSchema = z.object({
  data: z.array(userListViewSchema),
  pagination: paginationSchema,
});

export type FindUsersResponsePrimitives = z.infer<
  typeof findUsersResponseSchema
>;

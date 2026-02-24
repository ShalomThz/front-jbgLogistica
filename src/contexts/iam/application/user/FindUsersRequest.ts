import type { z } from "zod";
import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findUsersRequestSchema = createCriteriaSchema(userListViewSchema);

export type FindUsersRequestPrimitives = z.infer<
  typeof findUsersRequestSchema
>;

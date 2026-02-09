import { z } from "zod";
import { emailSchema, aggregateRootSchema } from "@/shared/domain";
import { userRoleSchema } from "../userRole/UserRole";

export const userSchema = z.object({
  id: z.string(),
  email: emailSchema,
  passwordHash: z.string(),
  role: userRoleSchema,
  storeId: z.string(),
  isActive: z.boolean(),
  ...aggregateRootSchema.shape,
});

export type UserPrimitives = z.infer<typeof userSchema>;

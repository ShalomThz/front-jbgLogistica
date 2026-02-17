import { z } from "zod";
import { emailSchema} from "@contexts/shared/domain/schemas/Email";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
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

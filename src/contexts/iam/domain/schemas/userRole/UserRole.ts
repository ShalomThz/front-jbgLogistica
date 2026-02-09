import { z } from "zod";
import { PERMISSIONS } from "./Permission";

export const userRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.enum(PERMISSIONS)),
});

export type Permission = z.infer<
  typeof userRoleSchema.shape.permissions.element
>;

export type UserRolePrimitives = z.infer<typeof userRoleSchema>;

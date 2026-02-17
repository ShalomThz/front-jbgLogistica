import z from "zod";

export const PERMISSIONS = [
  "CAN_SELL",
  "CAN_MANAGE_INVENTORY",
  "CAN_MANAGE_USERS",
  "CAN_VIEW_REPORTS",
  "CAN_MANAGE_CUSTOMERS",
  "CAN_MANAGE_STORES",
  "CAN_MANAGE_ZONES",
  "CAN_MANAGE_TARIFFS",
  "CAN_SHIP",
] as const;

export const userRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.enum(PERMISSIONS)),
});

export type Permission = z.infer<
  typeof userRoleSchema.shape.permissions.element
>;

export type UserRolePrimitives = z.infer<typeof userRoleSchema>;
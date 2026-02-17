import { z } from "zod";
import { emailSchema} from "@contexts/shared/domain/schemas/Email";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { userRoleSchema } from "./UserRole";
import { storeSchema } from "../store/Store";
import { zoneSchema } from "../../../../pricing/domain/schemas/zone/Zone";

export const nameSchema = z.string()
.min(2, "El nombre debe tener al menos 2 caracteres")
.max(100, "El nombre no puede exceder los 100 caracteres");

export const userSchema = z.object({
  id: z.string(),
  name: nameSchema,
  email: emailSchema,
  passwordHash: z.string(),
  role: userRoleSchema,
  storeId: z.string(),
  isActive: z.boolean(),
  ...aggregateRootSchema.shape,
});

export type UserPrimitives = z.infer<typeof userSchema>;

export const userListViewSchema = userSchema
  .omit({
    passwordHash: true,
    storeId: true,
  })
  .extend({
    store: storeSchema,
    zone: zoneSchema,
    lastLoginAt: z.iso.datetime({ offset: true }).nullable(),
  });

export type UserListViewPrimitives = z.infer<typeof userListViewSchema>;
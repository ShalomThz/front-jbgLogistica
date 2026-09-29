import z from "zod";
import { userSchema } from "../../domain/schemas/user/User";
import { userRoleInputSchema } from "../../domain/schemas/user/UserRole";

export const editUserRequestSchema = z
  .object({
    name: userSchema.shape.name.optional(),
    email: userSchema.shape.email.optional(),
    role: userRoleInputSchema.optional(),
    isActive: userSchema.shape.isActive.optional(),
    newPassword: z.string().min(8).optional(),
    storeId: userSchema.shape.storeId.optional(),
    phone: userSchema.shape.phone,
  });

export type EditUserRequest = z.infer<typeof editUserRequestSchema>;

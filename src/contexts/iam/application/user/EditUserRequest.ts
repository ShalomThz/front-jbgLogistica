import z from "zod";
import { userSchema } from "../../domain/schemas/user/User";

export const editUserRequestSchema = z
  .object({
    name: userSchema.shape.name.optional(),
    email: userSchema.shape.email.optional(),
    role: userSchema.shape.role.optional(),
    isActive: userSchema.shape.isActive.optional(),
    newPassword: z.string().min(8).optional(),
    storeId: userSchema.shape.storeId.optional(),
  });

export type   EditUserRequest = z.infer<typeof editUserRequestSchema>;

 import z from "zod";
import { userSchema } from "../../domain/schemas/user/User";

export const editUserRequestSchema = z
  .object({
    id: userSchema.shape.id,
    name: userSchema.shape.name.optional(),
    email: userSchema.shape.email.optional(),
    role: userSchema.shape.role.optional(),
    isActive: userSchema.shape.isActive.optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine(
    (data) => {
      if (data.oldPassword || data.newPassword) {
        return data.oldPassword !== undefined && data.newPassword !== undefined;
      }
      return true;
    },
    {
      message:
        "Both oldPassword and newPassword must be provided to change password",
      path: ["oldPassword"],
    },
  );

export type EditUserRequest = z.infer<typeof editUserRequestSchema>;

import { z } from "zod";
import { userSchema } from "./User";

export const registerUserRequestSchema = userSchema
  .omit({
    id: true,
    passwordHash: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters long"),
  });

export type RegisterUserRequestPrimitives = z.infer<
  typeof registerUserRequestSchema
>;

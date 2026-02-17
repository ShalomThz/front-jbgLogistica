import { z } from "zod";

export const loginResponseSchema = z.object({
  token: z.string(),
});

export type LoginResponsePrimitives = z.infer<typeof loginResponseSchema>;

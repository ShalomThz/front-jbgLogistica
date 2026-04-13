import { z } from "zod";

export const createDriverRequestSchema = z.object({
  userId: z.string(),
  licenseNumber: z.string().min(1),
});

export type CreateDriverRequest = z.infer<typeof createDriverRequestSchema>;

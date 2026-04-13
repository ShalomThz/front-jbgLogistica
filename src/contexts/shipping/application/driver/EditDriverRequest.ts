import { z } from "zod";

export const editDriverRequestSchema = z.object({
  licenseNumber: z.string().min(1, "La licencia es requerida").optional(),
  name: z.string().min(2, "Mínimo 2 caracteres").max(100).optional(),
  email: z.string().email("Email inválido").optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").optional(),
});

export type EditDriverRequest = z.infer<typeof editDriverRequestSchema>;

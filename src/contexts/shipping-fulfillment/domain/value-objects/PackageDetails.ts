import { z } from 'zod';

export const PackageDetailsSchema = z.object({
  width: z.number().positive('Ancho debe ser positivo'),
  height: z.number().positive('Alto debe ser positivo'),
  depth: z.number().positive('Profundidad debe ser positiva'),
  weight: z.number().positive('Peso debe ser positivo'),
});

export type PackageDetails = z.infer<typeof PackageDetailsSchema>;

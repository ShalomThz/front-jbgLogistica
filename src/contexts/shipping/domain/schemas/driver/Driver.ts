import { z } from "zod";
import { aggregateRootSchema } from "@/shared/domain";
const driverStatuses = ["AVAILABLE", "ON_ROUTE", "OFF_DUTY"] as const;

export const driverSchema = z.object({
  id: z.string(),
  userId: z.string(),
  licenseNumber: z.string().min(1, "License number is required"),
  status: z.enum(driverStatuses),
  ...aggregateRootSchema.shape,
});

export type DriverStatus = z.infer<typeof driverSchema.shape.status>;
export type DriverPrimitives = z.infer<typeof driverSchema>;
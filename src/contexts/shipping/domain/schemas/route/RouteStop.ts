import { z } from "zod";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { deliveryAttemptSchema } from "./DeliveryAttempt";

const routeStopStatuses = [
  "PENDING",
  "DELIVERED",
  "FAILED",
  "RETURNED",
] as const;

export const routeStopContactSchema = z.object({
  name: z.string().default(""),
  phone: z.string().default(""),
  company: z.string().default(""),
});

export const routeStopSchema = z.object({
  id: z.string(),
  stopOrder: z.number().int().positive(),
  shipmentId: z.string(),
  address: addressSchema,
  // Paradas creadas antes de este campo no lo traen.
  contact: routeStopContactSchema.default({ name: "", phone: "", company: "" }),
  orderReference: z.string().nullable().optional(),
  status: z.enum(routeStopStatuses),
  attempts: z.array(deliveryAttemptSchema),
});

export type RouteStopStatus = z.infer<typeof routeStopSchema.shape.status>;
export type RouteStopContactPrimitives = z.infer<typeof routeStopContactSchema>;
export type RouteStopPrimitives = z.infer<typeof routeStopSchema>;

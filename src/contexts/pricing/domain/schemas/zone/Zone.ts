import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
export const zoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Zone name is required"),
  description: z.string(),
  ...aggregateRootSchema.shape,
});

export type ZonePrimitives = z.infer<typeof zoneSchema>;

//CREATE ZONE USE CASE
export const createZoneRequestSchema = zoneSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
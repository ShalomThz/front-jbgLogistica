import { z } from "zod";

export const notificationEntityTypes = [
  "order",
  "shipment",
  "route",
  "inventory",
  "warehouse",
] as const;

export const notificationSchema = z.object({
  id: z.string(),
  eventName: z.string(),
  entityType: z.enum(notificationEntityTypes),
  entityId: z.string(),
  storeId: z.string(),
  title: z.string(),
  body: z.string(),
  severity: z.enum(["info", "warning"]),
  occurredOn: z.string(),
  readBy: z.array(z.string()),
});

export type NotificationEntityType = (typeof notificationEntityTypes)[number];
export type Notification = z.infer<typeof notificationSchema>;

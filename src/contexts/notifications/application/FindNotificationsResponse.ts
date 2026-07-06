import { notificationSchema } from "@contexts/notifications/domain/schemas/Notification";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findNotificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
  pagination: paginationSchema,
  unreadCount: z.number(),
});

export type FindNotificationsResponse = z.infer<
  typeof findNotificationsResponseSchema
>;

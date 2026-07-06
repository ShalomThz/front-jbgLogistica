import { notificationSchema } from "@contexts/notifications/domain/schemas/Notification";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findNotificationsRequestSchema =
  createCriteriaSchema(notificationSchema);

export type FindNotificationsRequest = z.infer<
  typeof findNotificationsRequestSchema
>;

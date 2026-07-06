import type { FindNotificationsRequest } from "@contexts/notifications/application/FindNotificationsRequest";
import {
  findNotificationsResponseSchema,
  type FindNotificationsResponse,
} from "@contexts/notifications/application/FindNotificationsResponse";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { ZodError } from "zod";

function parseFindNotifications(data: unknown): FindNotificationsResponse {
  try {
    return findNotificationsResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[notificationRepository] Parse error in find:`, error.issues);
      console.error(`[notificationRepository] Raw data received:`, data);
    }
    throw error;
  }
}

export const notificationRepository = {
  find: async (
    request: Partial<FindNotificationsRequest> = {},
  ): Promise<FindNotificationsResponse> => {
    const data = await httpClient<unknown>("/notification/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return parseFindNotifications(data);
  },

  markAsRead: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/notification/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead: async (): Promise<void> => {
    await httpClient<unknown>("/notification/read-all", {
      method: "POST",
    });
  },
};

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationRepository } from "@contexts/notifications/infrastructure/services/notificationRepository";
import type { FindNotificationsResponse } from "@contexts/notifications/application/FindNotificationsResponse";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

interface UseNotificationsOptions {
  limit?: number;
  enabled?: boolean;
}

export const useNotifications = ({
  limit = 20,
  enabled = true,
}: UseNotificationsOptions = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<FindNotificationsResponse>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, { limit }],
    queryFn: () =>
      notificationRepository.find({
        limit,
        order: { field: "occurredOn", direction: "DESC" },
      }),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationRepository.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    error: error?.message ?? null,

    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
};

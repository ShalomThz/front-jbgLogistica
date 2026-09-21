import { useInfiniteQuery } from "@tanstack/react-query";
import { zoneRepository } from "@contexts/pricing/infrastructure/services/zones/zoneRepository";
import type { FindZonesResponsePrimitives } from "@contexts/pricing/application/FindZonesResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

const INFINITE_ZONES_QUERY_KEY = ["zones", "infinite"];

interface UseInfiniteZonesOptions {
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useInfiniteZones = ({
  limit = 10,
  enabled = true,
  filters = [],
  search,
  order,
}: UseInfiniteZonesOptions = {}) => {
  const query = useInfiniteQuery<FindZonesResponsePrimitives>({
    queryKey: [...INFINITE_ZONES_QUERY_KEY, { limit, search, filters, order }],
    queryFn: ({ pageParam = 0 }) =>
      zoneRepository.find({
        filters,
        search,
        order,
        limit,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.data.length
        : undefined,
    enabled,
  });

  const zones = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    zones,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error?.message ?? null,
  };
};

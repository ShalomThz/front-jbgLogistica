import { useInfiniteQuery } from "@tanstack/react-query";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import type { FindStoresResponsePrimitives } from "@contexts/iam/application/store/FindStoresResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

const INFINITE_STORES_QUERY_KEY = ["stores", "infinite"];

interface UseInfiniteStoresOptions {
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useInfiniteStores = ({
  limit = 10,
  enabled = true,
  filters = [],
  search,
  order,
}: UseInfiniteStoresOptions = {}) => {
  const query = useInfiniteQuery<FindStoresResponsePrimitives>({
    queryKey: [
      ...INFINITE_STORES_QUERY_KEY,
      { limit, search, filters, order },
    ],
    queryFn: ({ pageParam = 0 }) =>
      storeRepository.find({
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

  const stores = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    stores,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error?.message ?? null,
  };
};

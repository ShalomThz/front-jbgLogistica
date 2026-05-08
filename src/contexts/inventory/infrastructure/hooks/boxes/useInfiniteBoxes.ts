import { useInfiniteQuery } from "@tanstack/react-query";
import { boxRepository } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import type { FindBoxesResponsePrimitives } from "@contexts/inventory/application/FindBoxesResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

const INFINITE_BOXES_QUERY_KEY = ["boxes", "infinite"];

interface UseInfiniteBoxesOptions {
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useInfiniteBoxes = ({
  limit = 10,
  enabled = true,
  filters = [],
  search,
  order,
}: UseInfiniteBoxesOptions = {}) => {
  const query = useInfiniteQuery<FindBoxesResponsePrimitives>({
    queryKey: [
      ...INFINITE_BOXES_QUERY_KEY,
      { limit, search, filters, order },
    ],
    queryFn: ({ pageParam = 0 }) =>
      boxRepository.find({
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

  const boxes = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    boxes,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error?.message ?? null,
  };
};

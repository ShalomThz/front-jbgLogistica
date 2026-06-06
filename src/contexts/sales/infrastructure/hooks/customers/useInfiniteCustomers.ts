import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type { FindCustomersResponsePrimitives } from "../../../application/customer/FindCustomersResponse";
import { customerRepository } from "../../services/customers/customerRepository";

const INFINITE_CUSTOMERS_QUERY_KEY = ["customers", "infinite"];

interface UseInfiniteCustomersOptions {
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useInfiniteCustomers = ({
  limit = 10,
  enabled = true,
  filters = [],
  search,
  order,
}: UseInfiniteCustomersOptions = {}) => {
  const { user } = useAuth();

  const effectiveFilters: Filter[] =
    user && !customerPolicies.listAll(user)
      ? [...filters, { field: "store.id", filterOperator: "=", value: user.store.id }]
      : filters;

  const query = useInfiniteQuery<FindCustomersResponsePrimitives>({
    queryKey: [
      ...INFINITE_CUSTOMERS_QUERY_KEY,
      { limit, search, filters: effectiveFilters, order, storeId: user?.store.id },
    ],
    queryFn: ({ pageParam = 0 }) =>
      customerRepository.find({
        filters: effectiveFilters,
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

  const customers = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    customers,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error?.message ?? null,
  };
};

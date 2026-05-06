import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type { FindCustomersResponsePrimitives } from "../../../application/customer/FindCustomersResponse";
import type { CreateCustomerRequest } from "../../../domain/schemas/customer/Customer";
import { customerRepository, type UpdateCustomerRequest } from "../../services/customers/customerRepository";

const CUSTOMERS_QUERY_KEY = ["customers"];

interface UseCustomersOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useCustomers = ({
  page = 1,
  limit,
  enabled = true,
  filters = [],
  search,
  order,
}: UseCustomersOptions = {}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const offset = limit !== undefined ? (page - 1) * limit : undefined;

  const effectiveFilters: Filter[] =
    user && !customerPolicies.listAll(user)
      ? [...filters, { field: "store.id", filterOperator: "=", value: user.storeId }]
      : filters;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindCustomersResponsePrimitives>({
    queryKey: [
      ...CUSTOMERS_QUERY_KEY,
      { page, limit, search, filters: effectiveFilters, order, storeId: user?.storeId },
    ],
    queryFn: () =>
      customerRepository.find({
        filters: effectiveFilters,
        search,
        order,
        limit,
        offset,
      }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const customers = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages =
    pagination && limit ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await customerRepository.provisionAccess(id, password)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  return {
    customers,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createCustomer: (data: CreateCustomerRequest) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateCustomer: (id: string, data: UpdateCustomerRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteCustomer: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,

    provisionAccess: (id: string, password: string) =>
      provisionMutation.mutateAsync({ id, password }),
    isProvisioning: provisionMutation.isPending,
    provisionError: provisionMutation.error?.message ?? null,
  };
};

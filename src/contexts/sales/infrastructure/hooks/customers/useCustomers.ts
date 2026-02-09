import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerRepository, type UpdateCustomerRequest } from "../../services";
import type { CustomerPrimitives, FindCustomersResponsePrimitives } from "../../../domain/schemas";

const CUSTOMERS_QUERY_KEY = ["customers"];

type CreateCustomerRequest = Omit<CustomerPrimitives, "id" | "createdAt" | "updatedAt">;

interface UseCustomersOptions {
  page?: number;
  limit?: number;
}

export const useCustomers = ({ page = 1, limit = 10 }: UseCustomersOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindCustomersResponsePrimitives>({
    queryKey: [...CUSTOMERS_QUERY_KEY, { page, limit }],
    queryFn: () => customerRepository.find({ filters: [], limit, offset }),
  });

  const customers = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

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
  };
};

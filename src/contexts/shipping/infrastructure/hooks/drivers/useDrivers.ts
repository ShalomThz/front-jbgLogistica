import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateDriverRequest } from "../../../application/driver/CreateDriverRequest";
import type { EditDriverRequest } from "../../../application/driver/EditDriverRequest";
import type { FindDriversRequest } from "../../../application/driver/FindDriversRequest";
import type { FindDriversResponse } from "../../../application/driver/FindDriversResponse";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";
import { driverRepository } from "../../services/drivers/driverRepository";

const DRIVERS_QUERY_KEY = ["drivers"] as const;

interface UseDriversParams extends Omit<FindDriversRequest, "limit" | "offset"> {
  page?: number;
  limit?: number;
}

export const useDrivers = ({
  page = 1,
  limit = 10,
  filters = [],
  order,
}: UseDriversParams) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindDriversResponse>({
    queryKey: [...DRIVERS_QUERY_KEY, { page, limit, filters, order }],
    queryFn: () => driverRepository.find({ filters, order, limit, offset }),
  });  

  const createMutation = useMutation({
    mutationFn: (request: CreateDriverRequest) =>
      driverRepository.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...DRIVERS_QUERY_KEY, { page, limit, filters, order }] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditDriverRequest }) =>
      driverRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...DRIVERS_QUERY_KEY, { page, limit, filters, order }] });
    },
  });

  const drivers: DriverListViewPrimitives[] = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  return {
    drivers,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createDriver: async (request: CreateDriverRequest) =>
      await createMutation.mutateAsync(request),
    isCreatingDriver: createMutation.isPending,
    createDriverError: createMutation.error?.message ?? null,

    updateDriver: (id: string, data: EditDriverRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,
  };
};

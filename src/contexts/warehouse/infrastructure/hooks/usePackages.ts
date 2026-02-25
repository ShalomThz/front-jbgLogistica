import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { packageRepository } from "@/contexts/warehouse/infrastructure/services/packageRepository";
import type { CreatePackageRequest, UpdatePackageRequest } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";

const PACKAGES_QUERY_KEY = ["packages"];

interface UsePackagesOptions {
  page?: number;
  limit?: number;
}

export const usePackages = ({ page = 1, limit = 10 }: UsePackagesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindPackagesResponsePrimitives>({
    queryKey: [...PACKAGES_QUERY_KEY, { page, limit }],
    queryFn: () => packageRepository.find({ filters: [], limit, offset, order: { field: "createdAt", direction: "DESC" } }),
  });

  const packages = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreatePackageRequest) => packageRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackageRequest }) =>
      packageRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packageRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_QUERY_KEY });
    },
  });

  return {
    packages,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createPackage: (data: CreatePackageRequest) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updatePackage: (id: string, data: UpdatePackageRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deletePackage: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};

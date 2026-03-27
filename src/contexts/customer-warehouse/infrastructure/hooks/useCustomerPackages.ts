import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerPackageRepository } from "@/contexts/customer-warehouse/infrastructure/services/customerPackageRepository";
import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";
import type {
  CreatePackageGroupRequest,
  EditPackageGroupRequest,
} from "@/contexts/warehouse/domain/PackageGroupSchema";

const CUSTOMER_PACKAGES_QUERY_KEY = ["customer-packages"];

interface UseCustomerPackagesOptions {
  page?: number;
  limit?: number;
}

export const useCustomerPackages = ({ page = 1, limit = 10 }: UseCustomerPackagesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindPackagesResponsePrimitives>({
    queryKey: [...CUSTOMER_PACKAGES_QUERY_KEY, { page, limit }],
    queryFn: () =>
      customerPackageRepository.find({
        filters: [],
        limit,
        offset,
        order: { field: "createdAt", direction: "DESC" },
      }),
  });

  const packages = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createPackageGroupMutation = useMutation({
    mutationFn: (payload: CreatePackageGroupRequest) => customerPackageRepository.createPackageGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PACKAGES_QUERY_KEY });
    },
  });

  const editPackageGroupMutation = useMutation({
    mutationFn: ({ packageGroupId, payload }: { packageGroupId: string; payload: EditPackageGroupRequest }) =>
      customerPackageRepository.editPackageGroup(packageGroupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PACKAGES_QUERY_KEY });
    },
  });

  const editPackageMutation = useMutation({
    mutationFn: ({ packageId, payload }: { packageId: string; payload: Partial<{ groupId: string | null; invoiceNumber: string }> }) =>
      customerPackageRepository.editPackage(packageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PACKAGES_QUERY_KEY });
    },
  });

  return {
    packages,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createPackageGroup: (payload: CreatePackageGroupRequest) =>
      createPackageGroupMutation.mutateAsync(payload),
    isCreatingPackageGroup: createPackageGroupMutation.isPending,
    createPackageGroupError: createPackageGroupMutation.error?.message ?? null,

    editPackageGroup: (packageGroupId: string, payload: EditPackageGroupRequest) =>
      editPackageGroupMutation.mutateAsync({ packageGroupId, payload }),
    isEditingPackageGroup: editPackageGroupMutation.isPending,
    editPackageGroupError: editPackageGroupMutation.error?.message ?? null,

    editPackage: (packageId: string, payload: Partial<{ groupId: string | null; invoiceNumber: string }>) =>
      editPackageMutation.mutateAsync({ packageId, payload }),
    isEditingPackage: editPackageMutation.isPending,
    editPackageError: editPackageMutation.error?.message ?? null,
  };
};

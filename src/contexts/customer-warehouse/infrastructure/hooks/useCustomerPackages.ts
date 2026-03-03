import { useQuery } from "@tanstack/react-query";
import { customerPackageRepository } from "@/contexts/customer-warehouse/infrastructure/services/customerPackageRepository";
import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";

const CUSTOMER_PACKAGES_QUERY_KEY = ["customer-packages"];

interface UseCustomerPackagesOptions {
  page?: number;
  limit?: number;
}

export const useCustomerPackages = ({ page = 1, limit = 10 }: UseCustomerPackagesOptions = {}) => {
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

  return {
    packages,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};

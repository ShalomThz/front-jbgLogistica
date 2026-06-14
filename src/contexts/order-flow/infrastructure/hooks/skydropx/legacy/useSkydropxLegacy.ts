import { useQuery } from "@tanstack/react-query";
import type { SkydropxCatalogItem } from "@contexts/order-flow/infrastructure/services/skydropx/legacy/SkydropxLegacyCatalog";
import { skydropxLegacyRepository } from "@contexts/order-flow/infrastructure/services/skydropx/legacy/skydropxLegacyRepository";

const SKYDROPX_QUERY_KEY = ["skydropx", "legacy"];

export const useSkydropxCategories = () => {
  const { data, isLoading, error, refetch } = useQuery<SkydropxCatalogItem[]>({
    queryKey: [...SKYDROPX_QUERY_KEY, "categories"],
    queryFn: () => skydropxLegacyRepository.getCategories(),
  });

  return {
    categories: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};

export const useSkydropxSubcategories = (categoryId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery<SkydropxCatalogItem[]>({
    queryKey: [...SKYDROPX_QUERY_KEY, "subcategories", categoryId],
    queryFn: () => skydropxLegacyRepository.getSubcategories(categoryId!),
    enabled: !!categoryId,
  });

  return {
    subcategories: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};
  
export const useSkydropxClasses = (subcategoryId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery<SkydropxCatalogItem[]>({
    queryKey: [...SKYDROPX_QUERY_KEY, "classes", subcategoryId],
    queryFn: () => skydropxLegacyRepository.getClasses(subcategoryId!),
    enabled: !!subcategoryId,
  });

  return {
    classes: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};

export const useSkydropxPackagings = () => {
  const { data, isLoading, error, refetch } = useQuery<SkydropxCatalogItem[]>({
    queryKey: [...SKYDROPX_QUERY_KEY, "packagings"],
    queryFn: () => skydropxLegacyRepository.getPackagings(),
  });

  return {
    packagings: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};

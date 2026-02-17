import { useQuery } from "@tanstack/react-query";
import type { SkydropxCatalogItem } from "../services/SkydropxCatalog";
import { skydropxRepository } from "../services/skydropxRepository";

const SKYDROPX_QUERY_KEY = ["skydropx"];

export const useSkydropxCategories = () => {
  const { data, isLoading, error, refetch } = useQuery<SkydropxCatalogItem[]>({
    queryKey: [...SKYDROPX_QUERY_KEY, "categories"],
    queryFn: () => skydropxRepository.getCategories(),
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
    queryFn: () => skydropxRepository.getSubcategories(categoryId!),
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
    queryFn: () => skydropxRepository.getClasses(subcategoryId!),
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
    queryFn: () => skydropxRepository.getPackagings(),
  });

  return {
    packagings: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};

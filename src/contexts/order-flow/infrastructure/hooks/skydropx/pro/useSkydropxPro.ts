import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  skydropxProRepository,
  type SkydropxProConsignmentNote,
  type SkydropxProConsignmentNotesPage,
  type SkydropxProPackaging,
  type SkydropxProPackagingsPage,
} from "@contexts/order-flow/infrastructure/services/skydropx/pro/skydropxProRepository";

const SKYDROPX_PRO_QUERY_KEY = ["skydropx", "pro"];

interface InfiniteOptions {
  search?: string;
  enabled?: boolean;
}

// --- Packagings -------------------------------------------------------------

export const useInfiniteSkydropxPackagings = ({
  search,
  enabled = true,
}: InfiniteOptions = {}) => {
  const query = useInfiniteQuery<SkydropxProPackagingsPage>({
    queryKey: [...SKYDROPX_PRO_QUERY_KEY, "packagings", "infinite", search ?? ""],
    queryFn: ({ pageParam = 1 }) =>
      skydropxProRepository.getPackagings({ search, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled,
  });

  const packagings = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    packagings,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error?.message ?? null,
  };
};

/** Resolves a single packaging by exact code (to label a preselected value). */
export const useSkydropxPackagingByCode = (
  code?: string,
): SkydropxProPackaging | null => {
  const { data } = useQuery<SkydropxProPackagingsPage>({
    queryKey: [...SKYDROPX_PRO_QUERY_KEY, "packagings", "byCode", code],
    queryFn: () => skydropxProRepository.getPackagings({ code }),
    enabled: !!code,
  });

  return data?.data[0] ?? null;
};

// --- Consignment notes (carta porte) ----------------------------------------

export const useInfiniteSkydropxConsignmentNotes = ({
  search,
  enabled = true,
}: InfiniteOptions = {}) => {
  const query = useInfiniteQuery<SkydropxProConsignmentNotesPage>({
    queryKey: [
      ...SKYDROPX_PRO_QUERY_KEY,
      "consignmentNotes",
      "infinite",
      search ?? "",
    ],
    queryFn: ({ pageParam = 1 }) =>
      skydropxProRepository.getConsignmentNotes({
        search,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled,
  });

  const consignmentNotes = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    consignmentNotes,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error?.message ?? null,
  };
};

/** Resolves a single carta porte by exact code (to label a preselected value). */
export const useSkydropxConsignmentNoteByCode = (
  code?: string,
): SkydropxProConsignmentNote | null => {
  const { data } = useQuery<SkydropxProConsignmentNotesPage>({
    queryKey: [...SKYDROPX_PRO_QUERY_KEY, "consignmentNotes", "byCode", code],
    queryFn: () => skydropxProRepository.getConsignmentNotes({ code }),
    enabled: !!code,
  });

  return data?.data[0] ?? null;
};

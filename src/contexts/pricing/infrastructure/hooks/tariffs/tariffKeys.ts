/**
 * Single source of truth for tariff-related React Query keys.
 * Hooks and mutations import from here so cache reads, writes and
 * invalidations can't drift apart.
 */

import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

interface ListArgs {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Filter[];
  order?: { field: string; direction: Direction };
}

interface PriceArgs {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
}

export const tariffKeys = {
  all: ["tariffs"] as const,
  lists: () => [...tariffKeys.all, "list"] as const,
  list: (args: ListArgs) => [...tariffKeys.lists(), args] as const,
  prices: () => [...tariffKeys.all, "price"] as const,
  price: (args: PriceArgs) => [...tariffKeys.prices(), args] as const,
};

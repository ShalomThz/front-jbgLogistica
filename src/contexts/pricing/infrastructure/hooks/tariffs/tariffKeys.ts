/**
 * Single source of truth for tariff-related React Query keys.
 * Hooks and mutations import from here so cache reads, writes and
 * invalidations can't drift apart.
 */

import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type { QuotePriceOptionsRequest, QuotePriceRequest } from "@contexts/pricing/application/QuotePrice";
import type { ShippingMode } from "@contexts/pricing/domain/schemas/tariff/Tariff";

interface ListArgs {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Filter[];
  order?: { field: string; direction: Direction };
}

export const tariffKeys = {
  all: ["tariffs"] as const,
  lists: () => [...tariffKeys.all, "list"] as const,
  list: (args: ListArgs) => [...tariffKeys.lists(), args] as const,
  quotes: () => [...tariffKeys.all, "quote"] as const,
  quote: (args: QuotePriceRequest) => [...tariffKeys.quotes(), args] as const,
  quoteOptions: (args: QuotePriceOptionsRequest) =>
    [...tariffKeys.quotes(), "options", args] as const,
  matrices: () => [...tariffKeys.all, "matrix"] as const,
  matrix: (
    zoneId: string,
    destinationCountry: string,
    shippingMode: ShippingMode,
  ) =>
    [
      ...tariffKeys.matrices(),
      zoneId,
      destinationCountry,
      shippingMode,
    ] as const,
};

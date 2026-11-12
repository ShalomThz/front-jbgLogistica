/**
 * Única fuente de las llaves de React Query de consolidados (mismo patrón que
 * `tariffKeys`): lecturas, escrituras e invalidaciones no pueden divergir.
 */

import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

interface ListArgs {
  page: number;
  limit: number;
  filters: Filter[];
  order?: { field: string; direction: Direction };
  search?: string;
}

export const consolidationKeys = {
  all: ["consolidations"] as const,
  lists: () => [...consolidationKeys.all, "list"] as const,
  list: (args: ListArgs) => [...consolidationKeys.lists(), args] as const,
  /** Métricas del listado. Cuelgan de `all`: toda mutación las invalida. */
  stats: () => [...consolidationKeys.all, "stats"] as const,
  detail: (id: string) => [...consolidationKeys.all, "detail", id] as const,
  /** Las órdenes que se pueden cargar. Cuelgan de `all`: agregar o quitar
   * órdenes de un consolidado también las invalida. */
  availableOrders: (search: string) =>
    [...consolidationKeys.all, "available-orders", search] as const,
};

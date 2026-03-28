import { useMemo, useState } from "react";
import type { RoutePrimitives } from "../../domain/schemas/route/RouteDelivery";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface DeliveryRouteFiltersState {
  searchQuery: string;
  statusFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export function useDeliveryRouteFilters(routes: RoutePrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = routes.filter((r) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        r.id.toLowerCase().includes(query) ||
        r.driverId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.id.localeCompare(b.id));
    else if (nameSort === "desc") result.sort((a, b) => b.id.localeCompare(a.id));

    return result;
  }, [routes, searchQuery, statusFilter, nameSort, dateSort]);

  const filters: DeliveryRouteFiltersState = {
    searchQuery,
    statusFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof DeliveryRouteFiltersState>(key: K, value: DeliveryRouteFiltersState[K]) => {
    if (key === "nameSort" && value !== "none") setDateSort("none");
    if (key === "dateSort" && value !== "none") setNameSort("none");

    const map = {
      searchQuery: setSearchQuery,
      statusFilter: setStatusFilter,
      nameSort: setNameSort,
      dateSort: setDateSort,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setNameSort("none");
    setDateSort("desc");
  };

  return { filters, setFilter, resetFilters, filtered };
}

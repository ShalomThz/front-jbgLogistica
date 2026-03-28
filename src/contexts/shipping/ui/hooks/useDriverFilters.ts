import { useMemo, useState } from "react";
import type { DriverPrimitives } from "../../domain/schemas/driver/Driver";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface DriverFiltersState {
  searchQuery: string;
  statusFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export function useDriverFilters(drivers: DriverPrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = drivers.filter((d) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        d.id.toLowerCase().includes(query) ||
        d.userId.toLowerCase().includes(query) ||
        d.licenseNumber.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.id.localeCompare(b.id));
    else if (nameSort === "desc") result.sort((a, b) => b.id.localeCompare(a.id));

    return result;
  }, [drivers, searchQuery, statusFilter, nameSort, dateSort]);

  const filters: DriverFiltersState = {
    searchQuery,
    statusFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof DriverFiltersState>(key: K, value: DriverFiltersState[K]) => {
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

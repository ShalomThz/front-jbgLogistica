import { useMemo, useState } from "react";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface ZoneFiltersState {
  searchQuery: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export function useZoneFilters(zones: ZonePrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = zones.filter(
      (z) =>
        searchQuery === "" ||
        z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (nameSort === "desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [zones, searchQuery, nameSort, dateSort]);

  const filters: ZoneFiltersState = {
    searchQuery,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof ZoneFiltersState>(key: K, value: ZoneFiltersState[K]) => {
    if (key === "nameSort" && value !== "none") setDateSort("none");
    if (key === "dateSort" && value !== "none") setNameSort("none");

    const map = {
      searchQuery: setSearchQuery,
      nameSort: setNameSort,
      dateSort: setDateSort,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setNameSort("none");
    setDateSort("desc");
  };

  return { filters, setFilter, resetFilters, filtered };
}

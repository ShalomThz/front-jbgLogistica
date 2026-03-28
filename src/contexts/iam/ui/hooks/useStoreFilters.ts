import { useMemo, useState } from "react";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface StoreFiltersState {
  searchQuery: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export function useStoreFilters(stores: StoreListViewPrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = stores.filter(
      (s) =>
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (nameSort === "desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [stores, searchQuery, nameSort, dateSort]);

  const filters: StoreFiltersState = {
    searchQuery,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof StoreFiltersState>(key: K, value: StoreFiltersState[K]) => {
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

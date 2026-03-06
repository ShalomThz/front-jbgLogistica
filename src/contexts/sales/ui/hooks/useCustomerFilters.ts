import { useMemo, useState } from "react";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";

export type DatePreset = "all" | "today" | "week" | "month" | "3months" | "custom";
export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface CustomerFiltersState {
  searchQuery: string;
  storeFilter: string;
  cityFilter: string;
  portalFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
  dateFilter: DatePreset;
  dateFrom: string;
  dateTo: string;
}

export interface CustomerFilterOptions {
  stores: { id: string; name: string }[];
  cities: string[];
}

export function useCustomerFilters(customers: CustomerListViewPrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [portalFilter, setPortalFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("none");
  const [dateFilter, setDateFilter] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const options = useMemo<CustomerFilterOptions>(() => {
    const storeMap = new Map<string, string>();
    const citySet = new Set<string>();

    for (const c of customers) {
      storeMap.set(c.store.id, c.store.name);
      if (c.address.city) citySet.add(c.address.city);
    }

    return {
      stores: Array.from(storeMap, ([id, name]) => ({ id, name })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      cities: Array.from(citySet).sort(),
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const result = customers.filter((c) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(query);

      const matchesStore = storeFilter === "all" || c.store.id === storeFilter;
      const matchesCity = cityFilter === "all" || c.address.city === cityFilter;
      const matchesPortal =
        portalFilter === "all" ||
        (portalFilter === "with" && c.user !== null) ||
        (portalFilter === "without" && c.user === null);
      const matchesDate = checkDateFilter(c.createdAt, dateFilter, dateFrom, dateTo);

      return matchesSearch && matchesStore && matchesCity && matchesPortal && matchesDate;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (nameSort === "desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [customers, searchQuery, storeFilter, cityFilter, portalFilter, nameSort, dateSort, dateFilter, dateFrom, dateTo]);

  const filters: CustomerFiltersState = {
    searchQuery,
    storeFilter,
    cityFilter,
    portalFilter,
    nameSort,
    dateSort,
    dateFilter,
    dateFrom,
    dateTo,
  };

  const setFilter = <K extends keyof CustomerFiltersState>(key: K, value: CustomerFiltersState[K]) => {
    const map = {
      searchQuery: setSearchQuery,
      storeFilter: setStoreFilter,
      cityFilter: setCityFilter,
      portalFilter: setPortalFilter,
      nameSort: setNameSort,
      dateSort: setDateSort,
      dateFilter: setDateFilter,
      dateFrom: setDateFrom,
      dateTo: setDateTo,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStoreFilter("all");
    setCityFilter("all");
    setPortalFilter("all");
    setNameSort("none");
    setDateSort("none");
    setDateFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return { filters, setFilter, resetFilters, filtered, options };
}

function checkDateFilter(
  createdAt: string,
  preset: DatePreset,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (preset === "all") return true;

  const date = new Date(createdAt);
  const now = new Date();

  if (preset === "today") return date.toDateString() === now.toDateString();

  if (preset === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }

  if (preset === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }

  if (preset === "3months") {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return date >= threeMonthsAgo;
  }

  if (preset === "custom") {
    if (dateFrom && date < new Date(dateFrom + "T00:00:00")) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
  }

  return true;
}

import { useMemo, useState } from "react";
import type { TariffListViewPrimitives } from "@contexts/pricing/domain/schemas/tariff/TariffListView";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface TariffFiltersState {
  searchQuery: string;
  countryFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface TariffFilterOptions {
  countries: { code: string; name: string }[];
}

interface UseTariffFiltersOptions {
  countryNames?: Record<string, string>;
}

const EMPTY_COUNTRY_NAMES: Record<string, string> = {};

export function useTariffFilters(tariffs: TariffListViewPrimitives[], options?: UseTariffFiltersOptions) {
  const countryNames = options?.countryNames ?? EMPTY_COUNTRY_NAMES;

  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filterOptions = useMemo<TariffFilterOptions>(() => {
    const countrySet = new Map<string, string>();

    for (const t of tariffs) {
      if (!countrySet.has(t.destinationCountry)) {
        countrySet.set(t.destinationCountry, countryNames[t.destinationCountry] ?? t.destinationCountry);
      }
    }

    return {
      countries: Array.from(countrySet, ([code, name]) => ({ code, name })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    };
  }, [tariffs, countryNames]);

  const filtered = useMemo(() => {
    const result = tariffs.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (countryNames[t.destinationCountry] ?? t.destinationCountry).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = countryFilter === "all" || t.destinationCountry === countryFilter;
      return matchesSearch && matchesCountry;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.zone.name.localeCompare(b.zone.name));
    else if (nameSort === "desc") result.sort((a, b) => b.zone.name.localeCompare(a.zone.name));

    return result;
  }, [tariffs, searchQuery, countryFilter, nameSort, dateSort, countryNames]);

  const filters: TariffFiltersState = {
    searchQuery,
    countryFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof TariffFiltersState>(key: K, value: TariffFiltersState[K]) => {
    if (key === "nameSort" && value !== "none") setDateSort("none");
    if (key === "dateSort" && value !== "none") setNameSort("none");

    const map = {
      searchQuery: setSearchQuery,
      countryFilter: setCountryFilter,
      nameSort: setNameSort,
      dateSort: setDateSort,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCountryFilter("all");
    setNameSort("none");
    setDateSort("desc");
  };

  return { filters, setFilter, resetFilters, filtered, options: filterOptions };
}

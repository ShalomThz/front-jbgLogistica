import { useMemo, useState } from "react";
import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface UserFiltersState {
  searchQuery: string;
  statusFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export function useUserFilters(users: UserListViewPrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = users.filter((u) => {
      const matchesSearch =
        searchQuery === "" ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? u.isActive : !u.isActive);
      return matchesSearch && matchesStatus;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (nameSort === "desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [users, searchQuery, statusFilter, nameSort, dateSort]);

  const filters: UserFiltersState = {
    searchQuery,
    statusFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof UserFiltersState>(key: K, value: UserFiltersState[K]) => {
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

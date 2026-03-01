import { useMemo, useState } from "react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";

export type DatePreset = "all" | "today" | "week" | "month" | "3months" | "custom";

export interface OrderFiltersState {
  searchQuery: string;
  statusFilter: string;
  storeFilter: string;
  paymentFilter: string;
  customerFilter: string;
  providerFilter: string;
  boxFilter: string;
  dateFilter: DatePreset;
  dateFrom: string;
  dateTo: string;
}

export interface OrderFilterOptions {
  stores: { id: string; name: string }[];
  customers: string[];
  providers: string[];
  boxes: string[];
}

export function useOrderFilters(orders: OrderListView[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [boxFilter, setBoxFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const options = useMemo<OrderFilterOptions>(() => {
    const storeMap = new Map<string, string>();
    const customerSet = new Set<string>();
    const providerSet = new Set<string>();
    const boxSet = new Set<string>();

    for (const order of orders) {
      storeMap.set(order.store.id, order.store.name);
      customerSet.add(order.destination.name);
      if (order.shipment?.provider?.providerName) {
        providerSet.add(order.shipment.provider.providerName);
      }
      if (order.package.boxId) {
        boxSet.add(order.package.boxId);
      }
    }

    return {
      stores: Array.from(storeMap, ([id, name]) => ({ id, name })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      customers: Array.from(customerSet).sort(),
      providers: Array.from(providerSet).sort(),
      boxes: Array.from(boxSet).sort(),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        order.destination.name.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.references.orderNumber?.toLowerCase().includes(query) ?? false) ||
        (order.references.partnerOrderNumber?.toLowerCase().includes(query) ?? false);

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesStore = storeFilter === "all" || order.store.id === storeFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "paid" && order.financials.isPaid) ||
        (paymentFilter === "unpaid" && !order.financials.isPaid);
      const matchesCustomer = customerFilter === "all" || order.destination.name === customerFilter;
      const matchesProvider =
        providerFilter === "all" ||
        order.shipment?.provider?.providerName === providerFilter;
      const matchesBox = boxFilter === "all" || order.package.boxId === boxFilter;
      const matchesDate = checkDateFilter(order.createdAt, dateFilter, dateFrom, dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStore &&
        matchesPayment &&
        matchesCustomer &&
        matchesProvider &&
        matchesBox &&
        matchesDate
      );
    });
  }, [
    orders,
    searchQuery,
    statusFilter,
    storeFilter,
    paymentFilter,
    customerFilter,
    providerFilter,
    boxFilter,
    dateFilter,
    dateFrom,
    dateTo,
  ]);

  const filters: OrderFiltersState = {
    searchQuery,
    statusFilter,
    storeFilter,
    paymentFilter,
    customerFilter,
    providerFilter,
    boxFilter,
    dateFilter,
    dateFrom,
    dateTo,
  };

  const setFilter = <K extends keyof OrderFiltersState>(key: K, value: OrderFiltersState[K]) => {
    const map = {
      searchQuery: setSearchQuery,
      statusFilter: setStatusFilter,
      storeFilter: setStoreFilter,
      paymentFilter: setPaymentFilter,
      customerFilter: setCustomerFilter,
      providerFilter: setProviderFilter,
      boxFilter: setBoxFilter,
      dateFilter: setDateFilter,
      dateFrom: setDateFrom,
      dateTo: setDateTo,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  return { filters, setFilter, filtered, options };
}

function checkDateFilter(
  createdAt: string,
  preset: DatePreset,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (preset === "all") return true;

  const orderDate = new Date(createdAt);
  const now = new Date();

  if (preset === "today") {
    return orderDate.toDateString() === now.toDateString();
  }

  if (preset === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  }

  if (preset === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return orderDate >= monthAgo;
  }

  if (preset === "3months") {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return orderDate >= threeMonthsAgo;
  }

  if (preset === "custom") {
    if (dateFrom && orderDate < new Date(dateFrom + "T00:00:00")) return false;
    if (dateTo && orderDate > new Date(dateTo + "T23:59:59")) return false;
  }

  return true;
}

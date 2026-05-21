export interface OrderReportByStore {
  storeId: string;
  storeName: string;
  count: number;
  revenue: number;
}

export interface OrderReportByCity {
  city: string;
  province: string;
  count: number;
}

export interface OrderReportByCountry {
  country: string;
  count: number;
  revenue: number;
}

export interface OrderReportByClient {
  name: string;
  count: number;
}

export interface OrderReportResponse {
  currency: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  byStatus: Record<string, number>;
  byStore: OrderReportByStore[];
  byDestinationCountry: OrderReportByCountry[];
  byDestinationCity: OrderReportByCity[];
  byOriginClient: OrderReportByClient[];
}

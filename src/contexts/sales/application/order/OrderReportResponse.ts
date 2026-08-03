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

export interface OrderReportByStatus {
  status: "DRAFT" | "PENDING_HQ_PROCESS" | "COMPLETED" | "CANCELLED";
  count: number;
  revenue: number;
}

export interface OrderReportByPaymentStatus {
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  count: number;
  outstandingAmount: number;
}

export interface OrderReportByOrderType {
  type: "HQ" | "PARTNER";
  count: number;
  revenue: number;
}

export interface OrderReportTimeSeriesPoint {
  period: string;
  count: number;
  revenue: number;
}

export interface OrderReportResponse {
  currency: string;
  totalOrders: number;
  /** Ingresos reales: solo órdenes completadas. Ver `byStatus` para el
   * desglose por estado. */
  totalRevenue: number;
  avgOrderValue: number | null;
  byStatus: OrderReportByStatus[];
  byStore: OrderReportByStore[];
  byDestinationCountry: OrderReportByCountry[];
  byDestinationCity: OrderReportByCity[];
  byOriginClient: OrderReportByClient[];
  byPaymentStatus: OrderReportByPaymentStatus[];
  byOrderType: OrderReportByOrderType[];
  timeSeries: OrderReportTimeSeriesPoint[];
  conversionWarnings: string[];
}

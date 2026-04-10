import * as XLSX from "xlsx";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { orderStatuses } from "@contexts/sales/domain/schemas/order/OrderStatuses";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";

interface StoreStats {
  name: string;
  count: number;
  total: number;
  paid: number;
  unpaid: number;
}

interface ReportStats {
  byStatus: Record<string, { count: number; total: number }>;
  byStore: StoreStats[];
}

export function exportOrderReport(
  orders: OrderListView[],
  stats: ReportStats,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Order detail
  const detailRows = orders.map((o) => ({
    Folio: o.id.slice(0, 8).toUpperCase(),
    Fecha: new Date(o.createdAt).toLocaleDateString("es-MX"),
    Destinatario: o.destination.name,
    Telefono: o.destination.phone ?? "",
    Ciudad: o.destination.address.city,
    Estado: o.destination.address.province,
    "Ref. JBG": o.references.orderNumber ?? "",
    "Ref. Agente": o.references.partnerOrderNumber ?? "",
    Estatus: ORDER_STATUS_LABELS[o.status as OrderStatus],
    Tienda: o.store.name,
    Total: o.financials.totalPrice?.amount ?? 0,
    Moneda: o.financials.totalPrice?.currency ?? "",
    Pagado: o.financials.isPaid ? "Si" : "No",
  }));
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Ordenes");

  // Sheet 2: Summary by store
  const storeRows = stats.byStore.map((s) => ({
    Tienda: s.name,
    Ordenes: s.count,
    Pagado: s.paid,
    Pendiente: s.unpaid,
    Total: s.total,
  }));
  const wsStore = XLSX.utils.json_to_sheet(storeRows);
  XLSX.utils.book_append_sheet(wb, wsStore, "Por Tienda");

  // Sheet 3: Summary by status
  const statusRows = orderStatuses.map((status) => ({
    Estatus: ORDER_STATUS_LABELS[status as OrderStatus],
    Ordenes: stats.byStatus[status].count,
    Total: stats.byStatus[status].total,
  }));
  const wsStatus = XLSX.utils.json_to_sheet(statusRows);
  XLSX.utils.book_append_sheet(wb, wsStatus, "Por Estatus");

  const fileName = `reporte-ordenes-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

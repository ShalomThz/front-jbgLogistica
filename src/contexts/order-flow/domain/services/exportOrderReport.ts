import * as XLSX from "xlsx";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import type { OrderReportResponse } from "@contexts/sales/application/order/OrderReportResponse";

export function exportOrderReport(report: OrderReportResponse) {
  const wb = XLSX.utils.book_new();

  const statusRows = Object.entries(report.byStatus).map(([status, count]) => ({
    Estatus: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
    Ordenes: count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusRows), "Por Estatus");

  const storeRows = report.byStore.map((s) => ({
    Tienda: s.storeName,
    Ordenes: s.count,
    Ingresos: s.revenue,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(storeRows), "Por Tienda");

  const countryRows = report.byDestinationCountry.map((c) => ({
    País: c.country,
    Ordenes: c.count,
    Ingresos: c.revenue,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(countryRows), "Por País");

  const cityRows = report.byDestinationCity.map((c) => ({
    Ciudad: c.city,
    Estado: c.province,
    Ordenes: c.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cityRows), "Por Ciudad");

  const clientRows = report.byOriginClient.map((c) => ({
    Cliente: c.name,
    Ordenes: c.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRows), "Por Cliente");

  const fileName = `reporte-ordenes-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

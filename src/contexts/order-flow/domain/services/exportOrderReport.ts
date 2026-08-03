import * as XLSX from "xlsx";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { PAYMENT_STATUS_LABELS } from "@contexts/shared/domain/schemas/PaymentStatus";
import type { OrderReportResponse } from "@contexts/sales/application/order/OrderReportResponse";

const ORDER_TYPE_LABELS: Record<"HQ" | "PARTNER", string> = {
  HQ: "Central (HQ)",
  PARTNER: "Partner",
};

export function exportOrderReport(report: OrderReportResponse) {
  const wb = XLSX.utils.book_new();

  const statusRows = report.byStatus.map((s) => ({
    Estatus: ORDER_STATUS_LABELS[s.status] ?? s.status,
    Ordenes: s.count,
    Ingresos: s.revenue,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusRows), "Por Estatus");

  const paymentStatusRows = report.byPaymentStatus.map((p) => ({
    Estado: PAYMENT_STATUS_LABELS[p.status] ?? p.status,
    Ordenes: p.count,
    "Por Cobrar": p.outstandingAmount,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentStatusRows), "Por Cobrar");

  const orderTypeRows = report.byOrderType.map((t) => ({
    Tipo: ORDER_TYPE_LABELS[t.type] ?? t.type,
    Ordenes: t.count,
    Ingresos: t.revenue,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderTypeRows), "Por Tipo");

  const timeSeriesRows = report.timeSeries.map((t) => ({
    Periodo: t.period,
    Ordenes: t.count,
    Ingresos: t.revenue,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timeSeriesRows), "Tendencia");

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

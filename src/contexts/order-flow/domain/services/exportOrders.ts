import * as XLSX from "xlsx";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";

export function exportOrders(orders: OrderListView[]) {
  const rows = orders.map((o) => ({
    "Ref. JBG": o.references.orderNumber ?? "",
    "Ref. Agente": o.references.partnerOrderNumber ?? "",
    Tipo: o.type === "PARTNER" ? "Agente" : "JBG",
    Estado: ORDER_STATUS_LABELS[o.status],
    "Remitente": o.origin.name,
    "Empresa Remitente": o.origin.company,
    "Tel. Remitente": o.origin.phone,
    "Email Remitente": o.origin.email,
    "Destinatario": o.destination.name,
    "Empresa Destino": o.destination.company,
    "Tel. Destino": o.destination.phone,
    "Email Destino": o.destination.email,
    "Ciudad Destino": o.destination.address.city,
    "Estado Destino": o.destination.address.province,
    "País Destino": o.destination.address.country,
    Tienda: o.store.name,
    Pagado: o.financials.isPaid ? "Sí" : "No",
    Total: o.financials.totalPrice?.amount ?? 0,
    Moneda: o.financials.totalPrice?.currency ?? "",
    "Guía": o.shipment?.label?.trackingNumber ?? "",
    Proveedor: o.shipment?.provider?.providerName ?? "",
    Creación: new Date(o.createdAt).toLocaleDateString("es-MX"),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ordenes");
  XLSX.writeFile(wb, `ordenes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

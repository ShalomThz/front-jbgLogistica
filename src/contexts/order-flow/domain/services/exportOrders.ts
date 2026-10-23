import * as XLSX from "xlsx";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { orderProgress } from "@contexts/order-flow/domain/services/orderProgress";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import {
  PAYMENT_STATUS_LABELS,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";

export function exportOrders(orders: OrderListView[]) {
  const rows = orders.map((o) => {
    const balance = resolveBilledBalance(o.financials);
    const progress = orderProgress(o);
    return {
    "Ref. JBG": o.references.orderNumber ?? "",
    "Ref. Agente": o.references.partnerOrderNumber ?? "",
    Tipo: o.type === "PARTNER" ? "Agente" : "JBG",
    // Lo mismo que dice la tabla: la etapa y, si agrega algo, el estatus.
    Estado: [progress.label, progress.detail].filter(Boolean).join(" · "),
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
    "Estado de Pago": PAYMENT_STATUS_LABELS[resolvePaymentStatus(o.financials)],
    "Total Pagado": balance?.paid ?? "",
    Saldo: balance?.pending ?? "",
    "Método de Pago": o.financials.paymentMethod
      ? PAYMENT_METHOD_LABELS[o.financials.paymentMethod]
      : "",
    "Concepto de Pago": o.financials.paymentConcept ?? "",
    Total: o.financials.totalPrice?.amount ?? 0,
    Moneda: o.financials.totalPrice?.currency ?? "",
    "Guía": o.shipment?.label?.trackingNumber ?? "",
    Proveedor: o.shipment?.provider?.providerName ?? "",
    Creación: new Date(o.createdAt).toLocaleDateString("es-MX"),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ordenes");
  XLSX.writeFile(wb, `ordenes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

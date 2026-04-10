import * as XLSX from "xlsx";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

export function exportBoxSales(
  sales: BoxSalePrimitives[],
  boxNames: Record<string, string>,
  userNames: Record<string, string>,
) {
  const rows = sales.flatMap((sale) =>
    sale.items.map((item) => ({
      Folio: sale.id.slice(0, 8).toUpperCase(),
      Fecha: new Date(sale.createdAt).toLocaleDateString("es-MX"),
      Vendedor: userNames[sale.soldBy] ?? sale.soldBy.slice(0, 8),
      Producto: boxNames[item.boxId] ?? item.boxId,
      Cantidad: item.quantity,
      "Precio Unitario": item.unitPrice.amount,
      Subtotal: item.subtotal.amount,
      Moneda: item.subtotal.currency,
      "Total Venta": sale.totalAmount.amount,
    })),
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Ventas de Cajas");
  XLSX.writeFile(wb, `ventas-cajas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

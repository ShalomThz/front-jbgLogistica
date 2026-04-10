import * as XLSX from "xlsx";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

export function exportBoxes(boxes: BoxPrimitives[]) {
  const rows = boxes.map((b) => ({
    Nombre: b.name,
    Largo: b.dimensions.length,
    Ancho: b.dimensions.width,
    Alto: b.dimensions.height,
    Unidad: b.dimensions.unit,
    Stock: b.stock,
    Precio: b.price.amount,
    Moneda: b.price.currency,
    Creacion: new Date(b.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Inventario de Cajas");
  XLSX.writeFile(wb, `inventario-cajas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

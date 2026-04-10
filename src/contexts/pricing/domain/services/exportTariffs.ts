import * as XLSX from "xlsx";
import type { TariffListViewPrimitives } from "@contexts/pricing/domain/schemas/tariff/TariffListView";

export function exportTariffs(tariffs: TariffListViewPrimitives[]) {
  const rows = tariffs.map((t) => ({
    Zona: t.zone.name,
    "Pais Destino": t.destinationCountry,
    Caja: t.box.name,
    "Dimensiones Caja": `${t.box.dimensions.length} × ${t.box.dimensions.width} × ${t.box.dimensions.height} ${t.box.dimensions.unit}`,
    Precio: t.price.amount,
    Moneda: t.price.currency,
    Actualizacion: new Date(t.updatedAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Tarifas");
  XLSX.writeFile(wb, `tarifas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

import * as XLSX from "xlsx";
import type { TariffListViewPrimitives } from "@contexts/pricing/domain/schemas/tariff/TariffListView";
import {
  PRICE_TYPE_LABELS,
  SERVICE_LEVEL_LABELS,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";

export function exportTariffs(tariffs: TariffListViewPrimitives[]) {
  const rows = tariffs.map((t) => ({
    Zona: t.zone.name,
    Pais: t.zone.country,
    Estado: t.zone.state,
    Caja: t.box.name,
    "Dimensiones Caja": `${t.box.dimensions.length} \u00d7 ${t.box.dimensions.width} \u00d7 ${t.box.dimensions.height} ${t.box.dimensions.unit}`,
    Servicio: SERVICE_LEVEL_LABELS[t.serviceLevel],
    "Tipo de precio": PRICE_TYPE_LABELS[t.priceType],
    Precio: t.price.amount,
    Moneda: t.price.currency,
    Actualizacion: new Date(t.updatedAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Tarifas");
  XLSX.writeFile(wb, `tarifas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

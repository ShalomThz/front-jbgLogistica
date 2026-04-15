import * as XLSX from "xlsx";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

export function exportZones(zones: ZonePrimitives[]) {
  const rows = zones.map((z) => ({
    Nombre: z.name,
    Descripcion: z.description,
    Creacion: new Date(z.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Zonas");
  XLSX.writeFile(wb, `zonas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

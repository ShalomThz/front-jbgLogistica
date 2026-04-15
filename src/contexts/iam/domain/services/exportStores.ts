import * as XLSX from "xlsx";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";

export function exportStores(stores: StoreListViewPrimitives[]) {
  const rows = stores.map((s) => ({
    Nombre: s.name,
    Telefono: s.phone,
    "Email Contacto": s.contactEmail,
    Direccion: s.address.address1,
    "Direccion 2": s.address.address2,
    Ciudad: s.address.city,
    Estado: s.address.province,
    "Codigo Postal": s.address.zip,
    Pais: s.address.country,
    Zona: s.zone.name,
    Creacion: new Date(s.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Tiendas");
  XLSX.writeFile(wb, `tiendas-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

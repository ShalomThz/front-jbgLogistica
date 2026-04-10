import * as XLSX from "xlsx";
import type { PackageListViewPrimitives } from "@contexts/warehouse/domain/WarehousePackageSchema";

export function exportWarehousePackages(packages: PackageListViewPrimitives[]) {
  const rows = packages.map((p) => ({
    ID: p.id.slice(0, 8).toUpperCase(),
    Proveedor: p.provider.name,
    Cliente: p.customer.name,
    "Email Cliente": p.customer.email,
    Tienda: p.store.name,
    "Factura Oficial": p.officialInvoice ?? "",
    Estatus: p.status,
    "Largo": p.dimensions.length,
    "Ancho": p.dimensions.width,
    "Alto": p.dimensions.height,
    "Unidad Dim.": p.dimensions.unit,
    Peso: p.weight.value,
    "Unidad Peso": p.weight.unit,
    "Persona Entrega": p.providerDeliveryPerson,
    "Recibido por": p.user.name,
    Creacion: new Date(p.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Bodega");
  XLSX.writeFile(wb, `bodega-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

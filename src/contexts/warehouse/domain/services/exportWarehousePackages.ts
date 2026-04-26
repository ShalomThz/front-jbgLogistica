import * as XLSX from "xlsx";
import type { PackageListViewPrimitives } from "@contexts/warehouse/domain/WarehousePackageSchema";

export function exportWarehousePackages(packages: PackageListViewPrimitives[]) {
  const rows = packages.flatMap((p) =>
    p.boxes.map((box, i) => ({
      ID: p.id.slice(0, 8).toUpperCase(),
      Caja: i + 1,
      Proveedor: p.provider.name,
      Cliente: p.customer.name,
      "Email Cliente": p.customer.email,
      Tienda: p.store.name,
      "Factura Oficial": p.officialInvoice ?? "",
      Estatus: p.status,
      Largo: box.dimensions.length,
      Ancho: box.dimensions.width,
      Alto: box.dimensions.height,
      "Unidad Dim.": box.dimensions.unit,
      Peso: box.weight.value,
      "Unidad Peso": box.weight.unit,
      "Persona Entrega": p.providerDetails.deliveryPerson,
      "Factura Proveedor": p.providerDetails.supplierInvoice ?? "",
      "Recibido por": p.user.name,
      Creacion: new Date(p.createdAt).toLocaleDateString("es-MX"),
    }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Bodega");
  XLSX.writeFile(wb, `bodega-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

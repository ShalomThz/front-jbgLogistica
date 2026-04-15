import * as XLSX from "xlsx";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";

export function exportCustomers(customers: CustomerListViewPrimitives[]) {
  const rows = customers.map((c) => ({
    Nombre: c.name,
    Empresa: c.company,
    Email: c.email,
    Telefono: c.phone,
    Direccion: c.address.address1,
    "Direccion 2": c.address.address2,
    Ciudad: c.address.city,
    Estado: c.address.province,
    "Codigo Postal": c.address.zip,
    Pais: c.address.country,
    Referencia: c.address.reference,
    Tienda: c.store.name,
    "Acceso Portal": c.user?.id ? "Si" : "No",
    Creacion: new Date(c.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Clientes");
  XLSX.writeFile(wb, `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

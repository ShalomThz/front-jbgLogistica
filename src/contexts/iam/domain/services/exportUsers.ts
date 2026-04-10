import * as XLSX from "xlsx";
import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";

export function exportUsers(users: UserListViewPrimitives[]) {
  const rows = users.map((u) => ({
    Nombre: u.name,
    Email: u.email,
    Rol: u.role.name,
    Tipo: u.type,
    Activo: u.isActive ? "Si" : "No",
    Tienda: u.store.name,
    "Ultimo Acceso": u.lastLoginAt
      ? new Date(u.lastLoginAt).toLocaleDateString("es-MX")
      : "Nunca",
    Creacion: new Date(u.createdAt).toLocaleDateString("es-MX"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Usuarios");
  XLSX.writeFile(wb, `usuarios-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

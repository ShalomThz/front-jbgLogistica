import { useState } from "react";
import { Plus, Search, Shield } from "lucide-react";
import {
  Input,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { RoleDetailDialog } from "../components/role/RoleDetailDialog";
import { RoleFormDialog } from "../components/role/RoleFormDialog";
import { RoleDeleteDialog } from "../components/role/RoleDeleteDialog";
import type { UserRolePrimitives, Permission } from "@contexts/iam/domain/schemas/userRole/UserRole";

const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_SELL: "Vender",
  CAN_MANAGE_INVENTORY: "Inventario",
  CAN_MANAGE_USERS: "Usuarios",
  CAN_VIEW_REPORTS: "Reportes",
  CAN_MANAGE_CUSTOMERS: "Clientes",
  CAN_MANAGE_STORES: "Tiendas",
  CAN_MANAGE_ZONES: "Zonas",
  CAN_MANAGE_TARIFFS: "Tarifas",
  CAN_SHIP: "Envíos",
};

const INITIAL_DATA: UserRolePrimitives[] = [
  {
    name: "Administrador",
    permissions: [
      "CAN_SELL",
      "CAN_MANAGE_INVENTORY",
      "CAN_MANAGE_USERS",
      "CAN_VIEW_REPORTS",
      "CAN_MANAGE_CUSTOMERS",
    ],
  },
  { name: "Vendedor", permissions: ["CAN_SELL", "CAN_MANAGE_CUSTOMERS"] },
  { name: "Bodeguero", permissions: ["CAN_MANAGE_INVENTORY"] },
  { name: "Conductor", permissions: ["CAN_SELL"] },
  { name: "Auditor", permissions: ["CAN_VIEW_REPORTS"] },
];

export const RolesPage = () => {
  const [roles, setRoles] = useState<UserRolePrimitives[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<UserRolePrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState<UserRolePrimitives | null>(null);
  const [deleteRole, setDeleteRole] = useState<UserRolePrimitives | null>(null);

  const filtered = roles.filter(
    (r) =>
      searchQuery === "" ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = (data: UserRolePrimitives) => {
    setRoles((prev) => [...prev, data]);
    setFormOpen(false);
  };

  const handleUpdate = (data: UserRolePrimitives, originalName?: string) => {
    if (!originalName) return;
    setRoles((prev) => prev.map((r) => (r.name === originalName ? data : r)));
    setEditRole(null);
  };

  const handleDelete = () => {
    if (!deleteRole) return;
    setRoles((prev) => prev.filter((r) => r.name !== deleteRole.name));
    setDeleteRole(null);
  };

  const handleEditFromDetail = (role: UserRolePrimitives) => {
    setSelected(null);
    setEditRole(role);
  };

  const handleDeleteFromDetail = (role: UserRolePrimitives) => {
    setSelected(null);
    setDeleteRole(role);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Crear Rol
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Permisos</TableHead>
              <TableHead className="hidden sm:table-cell">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron roles.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.name}
                  className="cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      {r.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.permissions.length}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.slice(0, 3).map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {PERMISSION_LABELS[p as Permission] ?? p}
                        </Badge>
                      ))}
                      {r.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{r.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <RoleDetailDialog
        role={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <RoleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
      />
      <RoleFormDialog
        open={!!editRole}
        onClose={() => setEditRole(null)}
        onSave={handleUpdate}
        role={editRole}
      />
      <RoleDeleteDialog
        role={deleteRole}
        open={!!deleteRole}
        onClose={() => setDeleteRole(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

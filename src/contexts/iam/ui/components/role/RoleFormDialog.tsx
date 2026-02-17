import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from "@contexts/shared/shadcn";
import { PERMISSIONS } from "@contexts/iam/domain/schemas/userRole/Permission";
import type { UserRolePrimitives, Permission } from "@contexts/iam/domain/schemas/userRole/UserRole";

const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_SELL: "Vender",
  CAN_MANAGE_INVENTORY: "Gestionar inventario",
  CAN_MANAGE_USERS: "Gestionar usuarios",
  CAN_VIEW_REPORTS: "Ver reportes",
  CAN_MANAGE_CUSTOMERS: "Gestionar clientes",
  CAN_MANAGE_STORES: "Gestionar tiendas",
  CAN_MANAGE_ZONES: "Gestionar zonas",
  CAN_MANAGE_TARIFFS: "Gestionar tarifas",
  CAN_SHIP: "Enviar paquetes",
};

const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  CAN_SELL: "Permite realizar ventas y crear órdenes",
  CAN_MANAGE_INVENTORY: "Permite gestionar productos y stock",
  CAN_MANAGE_USERS: "Permite crear, editar y eliminar usuarios",
  CAN_VIEW_REPORTS: "Permite ver reportes y estadísticas",
  CAN_MANAGE_CUSTOMERS: "Permite gestionar clientes",
  CAN_MANAGE_STORES: "Permite crear, editar y eliminar tiendas",
  CAN_MANAGE_ZONES: "Permite gestionar zonas de envío",
  CAN_MANAGE_TARIFFS: "Permite gestionar tarifas y precios",
  CAN_SHIP: "Permite gestionar envíos y rutas de entrega",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserRolePrimitives, originalName?: string) => void;
  role?: UserRolePrimitives | null;
}

export const RoleFormDialog = ({ open, onClose, onSave, role }: Props) => {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setPermissions(role.permissions as Permission[]);
      } else {
        setName("");
        setPermissions([]);
      }
    }
  }, [open, role]);

  const togglePermission = (permission: Permission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const selectAll = () => {
    setPermissions([...PERMISSIONS]);
  };

  const clearAll = () => {
    setPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, permissions }, role?.name);
  };

  const isEdit = !!role;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Rol" : "Crear Rol"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del rol."
              : "Ingresa los datos del nuevo rol."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del rol *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Supervisor"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permisos</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                >
                  Ninguno
                </Button>
              </div>
            </div>
            <div className="rounded-md border p-3 space-y-3">
              {PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-start space-x-3">
                  <Checkbox
                    id={permission}
                    checked={permissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={permission}
                      className="cursor-pointer text-sm font-medium"
                    >
                      {PERMISSION_LABELS[permission]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {PERMISSION_DESCRIPTIONS[permission]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {permissions.length} de {PERMISSIONS.length} permisos
              seleccionados
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={permissions.length === 0}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

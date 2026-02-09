import { Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@/shared/shadcn";
import type { UserRolePrimitives, Permission } from "../../../domain";

const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_SELL: "Vender",
  CAN_MANAGE_INVENTORY: "Gestionar inventario",
  CAN_MANAGE_USERS: "Gestionar usuarios",
  CAN_VIEW_REPORTS: "Ver reportes",
  CAN_MANAGE_CUSTOMERS: "Gestionar clientes",
  CAN_MANAGE_STORES: "Gestionar tiendas",
  CAN_MANAGE_ZONES: "Gestionar zonas",
  CAN_MANAGE_TARIFFS: "Gestionar tarifas",
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
};

interface Props {
  role: UserRolePrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (role: UserRolePrimitives) => void;
  onDelete?: (role: UserRolePrimitives) => void;
}

export const RoleDetailDialog = ({
  role,
  open,
  onClose,
  onEdit,
  onDelete,
}: Props) => {
  if (!role) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle>{role.name}</DialogTitle>
          <DialogDescription>
            {role.permissions.length} permisos asignados
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Permisos</h4>
            <div className="rounded-md border divide-y">
              {role.permissions.map((p) => (
                <div key={p} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {PERMISSION_LABELS[p as Permission] ?? p}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {PERMISSION_DESCRIPTIONS[p as Permission]}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {p}
                  </Badge>
                </div>
              ))}
              {role.permissions.length === 0 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Sin permisos asignados
                </div>
              )}
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(role)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(role)}>
                <Pencil className="mr-1.5 size-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

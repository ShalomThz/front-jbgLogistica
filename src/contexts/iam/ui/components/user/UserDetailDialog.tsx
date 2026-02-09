import { Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@/shared/shadcn";
import type { UserPrimitives } from "../../../domain";

const PERMISSION_LABELS: Record<string, string> = {
  CAN_SELL: "Vender",
  CAN_MANAGE_INVENTORY: "Gestionar inventario",
  CAN_MANAGE_USERS: "Gestionar usuarios",
  CAN_VIEW_REPORTS: "Ver reportes",
  CAN_MANAGE_CUSTOMERS: "Gestionar clientes",
  CAN_MANAGE_STORES: "Gestionar tiendas",
  CAN_MANAGE_ZONES: "Gestionar zonas",
  CAN_MANAGE_TARIFFS: "Gestionar tarifas",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  user: UserPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (user: UserPrimitives) => void;
  onDelete?: (user: UserPrimitives) => void;
}

export const UserDetailDialog = ({
  user,
  open,
  onClose,
  onEdit,
  onDelete,
}: Props) => {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{user.email}</span>
            <Badge variant={user.isActive ? "default" : "outline"}>
              {user.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </DialogTitle>
          <DialogDescription>Usuario {user.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Cuenta</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Email" value={user.email} />
              <DetailRow
                label="Estado"
                value={user.isActive ? "Activo" : "Inactivo"}
              />
              <DetailRow label="Tienda" value={user.storeId} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Rol: {user.role.name}</h4>
            <div className="rounded-md border p-3">
              <div className="flex flex-wrap gap-1.5">
                {user.role.permissions.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {PERMISSION_LABELS[p] ?? p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow
                label="Creado"
                value={formatDateTime(user.createdAt)}
              />
              <DetailRow
                label="Actualizado"
                value={formatDateTime(user.updatedAt)}
              />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(user)}>
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

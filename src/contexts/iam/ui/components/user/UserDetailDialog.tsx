import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Calendar, Check, Clock, Mail, Pencil, Phone, Shield, Store, Trash2, User } from "lucide-react";
import type { UserListViewPrimitives } from "../../../domain/schemas/user/User";
import { PERMISSION_LABELS, PERMISSION_GROUPS } from "./constants";

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  user: UserListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (user: UserListViewPrimitives) => void;
  onDelete?: (user: UserListViewPrimitives) => void;
}

export const UserDetailDialog = ({
  user,
  open,
  onClose,
  onEdit,
  onDelete,
}: Props) => {
  if (!user) return null;

  const permissionSet = new Set(user.role.permissions);
  const totalPerms = user.role.permissions.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl flex items-center gap-2">
                {user.name}
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                  className="text-xs"
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Store className="size-3" />
                  {user.store.name}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-0 md:divide-x">
          {/* ── Columna izquierda: Información ── */}
          <div className="space-y-4 md:pr-6 pb-4 md:pb-0">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Información</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nombre</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Telefono</span>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {user.phone ? (
                      <>
                        <Phone className="size-3.5 text-muted-foreground" />
                        {user.phone}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tienda</span>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Store className="size-3.5 text-muted-foreground" />
                    {user.store.name}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rol</span>
                  <Badge variant="secondary">{user.role.name}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              {/* Auditoría */}
              <div className="rounded-md border p-3 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Auditoría</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Creado
                  </span>
                  <span className="text-xs font-medium">{formatDateTime(user.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Actualizado
                  </span>
                  <span className="text-xs font-medium">{formatDateTime(user.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Columna derecha: Permisos ── */}
          <div className="space-y-4 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Permisos</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalPerms} asignados
              </Badge>
            </div>

            <div className="rounded-md border divide-y max-h-[50vh] overflow-y-auto">
              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = group.permissions.filter((p) => permissionSet.has(p));
                const Icon = group.icon;
                const allSelected = groupPerms.length === group.permissions.length;
                const hasAny = groupPerms.length > 0;

                return (
                  <div
                    key={group.label}
                    className={cn(
                      "px-3 py-2.5 space-y-2",
                      !hasAny && "opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">{group.label}</span>
                      {allSelected ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Todos
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {groupPerms.length}/{group.permissions.length}
                        </span>
                      )}
                    </div>
                    {hasAny && !allSelected && (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {groupPerms.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-xs font-normal gap-1"
                          >
                            <Check className="size-3 text-green-600" />
                            {PERMISSION_LABELS[p]}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {hasAny && allSelected && (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {groupPerms.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[10px] font-normal gap-0.5 text-muted-foreground"
                          >
                            <Check className="size-2.5 text-green-600" />
                            {PERMISSION_LABELS[p]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <>
            <Separator />
            <DialogFooter>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              )}
              {onEdit && (
                <Button onClick={() => onEdit(user)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

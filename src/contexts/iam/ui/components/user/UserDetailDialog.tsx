import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { UserListViewPrimitives } from "../../../domain/schemas/user/User";
import { PERMISSION_LABELS, PERMISSION_GROUPS } from "./constants";

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{user.name}</span>
            <Badge variant={user.isActive ? "default" : "outline"}>
              {user.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account">
          <TabsList className="w-full">
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="permissions">
              Permisos
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {user.role.permissions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-3 mt-3">
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={user.name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow
                label="Estado"
                value={user.isActive ? "Activo" : "Inactivo"}
              />
              <DetailRow label="Tienda" value={user.store.name} />
              <DetailRow label="Rol" value={user.role.name} />
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-3">
            <div className="rounded-md border divide-y">
              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = group.permissions.filter((p) =>
                  permissionSet.has(p),
                );
                if (groupPerms.length === 0) return null;
                const Icon = group.icon;
                const allSelected =
                  groupPerms.length === group.permissions.length;

                return (
                  <div key={group.label} className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1">
                        {group.label}
                      </span>
                      {allSelected ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Todos
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {groupPerms.length}/{group.permissions.length}
                        </span>
                      )}
                    </div>
                    {!allSelected && (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {groupPerms.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-xs font-normal gap-1"
                          >
                            <Check className="size-3" />
                            {PERMISSION_LABELS[p]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-3">
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
          </TabsContent>
        </Tabs>

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

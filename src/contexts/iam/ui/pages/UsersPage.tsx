import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { UserDetailDialog } from "../components/user/UserDetailDialog";
import { CreateUserDialog } from "../components/user/CreateUserDialog";
import { EditUserDialog } from "../components/user/EditUserDialog";
import { UserDeleteDialog } from "../components/user/UserDeleteDialog";
import { UserFilters } from "../components/user/UserFilters";
import { exportUsers } from "@contexts/iam/domain/services/exportUsers";
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import { useUserFilters } from "../hooks/useUserFilters";
import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";
import type { RegisterUserRequestPrimitives } from "@contexts/iam/application/user/RegisterUserRequest";
import type { EditUserRequest } from "../../application/user/EditUserRequest";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";

const LIMIT_OPTIONS = [10, 20, 50];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    users,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createUser,
    isCreating,
    updateUser,
    isUpdating,
    deleteUser,
    isDeleting,
  } = useUsers({ page, limit });

  const { filters, setFilter, resetFilters, filtered } = useUserFilters(users);

  const [selected, setSelected] = useState<UserListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListViewPrimitives | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<UserListViewPrimitives | null>(null);

  const handleCreate = async (data: RegisterUserRequestPrimitives) => {
    try {
      await createUser(data);
      setFormOpen(false);
      setPage(1);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleUpdate = async (data: EditUserRequest) => {
    if (!editUser) return;
    try {
      await updateUser(editUser.id, data);
      setEditUser(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteUserDialog) return;
    await deleteUser(deleteUserDialog.id);
    setDeleteUserDialog(null);
    setPage(1);
  };

  const handleEditFromDetail = (user: UserListViewPrimitives) => {
    setSelected(null);
    setEditUser(user);
  };

  const handleDeleteFromDetail = (user: UserListViewPrimitives) => {
    if (user.id === currentUser?.id) return;
    setSelected(null);
    setDeleteUserDialog(user);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + users.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return <PageLoader text="Cargando usuarios..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Usuario
          </Button>
        </div>
      </div>
      <UserFilters
        filters={filters}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        setFilter={setFilter}
        onLimitChange={(v) => { setLimit(v); setPage(1); }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
        onExport={() => exportUsers(filtered)}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Tienda</TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                Permisos
              </TableHead>
              <TableHead className="hidden lg:table-cell">Creado</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(u)}
                >
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>{u.role.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {u.store.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right font-mono">
                    {u.role.permissions.length}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "outline"}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {from}-{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <UserDetailDialog
        user={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={selected?.id === currentUser?.id ? undefined : handleDeleteFromDetail}
      />
      <CreateUserDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      {editUser && (
        <EditUserDialog
          open
          onClose={() => setEditUser(null)}
          onSave={handleUpdate}
          user={editUser}
          isLoading={isUpdating}
        />
      )}
      <UserDeleteDialog
        user={deleteUserDialog}
        open={!!deleteUserDialog}
        onClose={() => setDeleteUserDialog(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

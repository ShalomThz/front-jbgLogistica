import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Input,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { StoreDetailDialog } from "../components/store/StoreDetailDialog";
import { StoreFormDialog } from "../components/store/StoreFormDialog";
import { StoreDeleteDialog } from "../components/store/StoreDeleteDialog";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";
import type { CreateStoreRequestPrimitives } from "@contexts/iam/application/store/CreateStoreRequest";

const LIMIT_OPTIONS = [10, 20, 50];

export const StoresPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    stores,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createStore,
    isCreating,
    updateStore,
    isUpdating,
    deleteStore,
    isDeleting,
  } = useStores({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<StoreListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreListViewPrimitives | null>(null);
  const [deleteStoreDialog, setDeleteStoreDialog] = useState<StoreListViewPrimitives | null>(null);

  const filtered = stores.filter(
    (s) =>
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (data: CreateStoreRequestPrimitives) => {
    await createStore(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateStoreRequestPrimitives) => {
    if (!editStore) return;
    await updateStore(editStore.id, data);
    setEditStore(null);
  };

  const handleDelete = async () => {
    if (!deleteStoreDialog) return;
    await deleteStore(deleteStoreDialog.id);
    setDeleteStoreDialog(null);
    setPage(1);
  };

  const handleEditFromDetail = (store: StoreListViewPrimitives) => {
    setSelected(null);
    setEditStore(store);
  };

  const handleDeleteFromDetail = (store: StoreListViewPrimitives) => {
    setSelected(null);
    setDeleteStoreDialog(store);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + stores.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return <PageLoader text="Cargando tiendas..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tiendas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Tienda
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ciudad o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setLimit(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-32.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Zona</TableHead>
              <TableHead className="hidden md:table-cell">Ciudad</TableHead>
              <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden xl:table-cell">Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron tiendas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {s.zone.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.address.city}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {s.phone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {s.contactEmail}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("es-MX")}
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
      <StoreDetailDialog
        store={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <StoreFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      <StoreFormDialog
        open={!!editStore}
        onClose={() => setEditStore(null)}
        onSave={handleUpdate}
        store={editStore}
        isLoading={isUpdating}
      />
      <StoreDeleteDialog
        store={deleteStoreDialog}
        open={!!deleteStoreDialog}
        onClose={() => setDeleteStoreDialog(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

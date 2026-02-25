import { usePackages } from "@/contexts/warehouse/infrastructure/hooks/usePackages";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { useState } from "react";
import type {
  CreatePackageRequest,
  PackageListViewPrimitives,
  UpdatePackageRequest,
  WarehousePackageStatus,
} from "../../domain/WarehousePackageSchema";
import { CreatePackageDialog } from "../components/CreatePackageDialog";
import { EditPackageDialog } from "../components/EditPackageDialog";
import { WarehouseDeleteDialog } from "../components/WarehouseDeleteDialog";
import { WarehouseDetailDialog } from "../components/WarehouseDetailDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

const STATUS_VARIANT: Record<WarehousePackageStatus, "default" | "secondary" | "outline"> = {
  WAREHOUSE: "secondary",
  SHIPPED: "outline",
  DELIVERED: "default",
  REPACKED: "secondary",
  AUTHORIZED: "default",
};

const LIMIT_OPTIONS = [10, 20, 50];

// ─── Component ────────────────────────────────────────────────────────────────

export const WarehousePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    packages,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createPackage,
    isCreating,
    updatePackage,
    isUpdating,
    deletePackage,
    isDeleting,
  } = usePackages({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<PackageListViewPrimitives | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<PackageListViewPrimitives | null>(null);
  const [deletePkg, setDeletePkg] = useState<PackageListViewPrimitives | null>(null);

  const filtered = packages.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      p.id.toLowerCase().includes(query) ||
      p.officialInvoice.toLowerCase().includes(query) ||
      p.provider.name.toLowerCase().includes(query) ||
      p.customer.name.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: CreatePackageRequest) => {
    await createPackage(data);
    setPage(1);
  };

  const handleUpdate = async (data: UpdatePackageRequest) => {
    if (!editPkg) return;
    await updatePackage(editPkg.id, data);
    setEditPkg(null);
  };

  const handleDelete = async () => {
    if (!deletePkg) return;
    await deletePackage(deletePkg.id);
    setDeletePkg(null);
    setPage(1);
  };

  const handleEditFromDetail = (pkg: PackageListViewPrimitives) => {
    setSelected(null);
    setEditPkg(pkg);
  };

  const handleDeleteFromDetail = (pkg: PackageListViewPrimitives) => {
    setSelected(null);
    setDeletePkg(pkg);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + packages.length : 0;
  const total = pagination?.total ?? 0;
  const inWarehouse = packages.filter((p) => p.status === "WAREHOUSE").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando paquetes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bodega</h1>
          <p className="text-sm text-muted-foreground">
            {inWarehouse} paquetes en bodega · {total} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Registrar Paquete
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, factura, proveedor o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="WAREHOUSE">En bodega</SelectItem>
            <SelectItem value="AUTHORIZED">Autorizado</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="REPACKED">Reempacado</SelectItem>
          </SelectContent>
        </Select>
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

      {/* ── Table ── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead className="hidden sm:table-cell">Tienda</TableHead>
              <TableHead className="hidden md:table-cell">Proveedor</TableHead>
              <TableHead className="hidden lg:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Peso</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron paquetes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <TableCell>
                    <span className="font-mono text-sm">{p.officialInvoice}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {p.store.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {p.provider.name}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {p.customer.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">
                    {p.weight.value} {p.weight.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status]}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {pagination && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {from}–{to} de {total}
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

      {/* ── Dialogs ── */}
      <WarehouseDetailDialog
        pkg={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <CreatePackageDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      {editPkg && (
        <EditPackageDialog
          open={!!editPkg}
          onClose={() => setEditPkg(null)}
          onSave={handleUpdate}
          pkg={editPkg}
          isLoading={isUpdating}
        />
      )}
      <WarehouseDeleteDialog
        pkg={deletePkg}
        open={!!deletePkg}
        onClose={() => setDeletePkg(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

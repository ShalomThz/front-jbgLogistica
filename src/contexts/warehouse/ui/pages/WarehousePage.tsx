import { usePackages } from "@/contexts/warehouse/infrastructure/hooks/usePackages";
import {
  Badge,
  Button,
  Checkbox,
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
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  CreatePackageRequest,
  PackageListViewPrimitives,
  UpdatePackageRequest,
  WarehousePackageStatus,
} from "../../domain/WarehousePackageSchema";
import type { EditPackageGroupRequest } from "../../domain/PackageGroupSchema";
import { CreatePackageDialog } from "../components/CreatePackageDialog";
import { CreatePackageGroupDialog } from "../components/CreatePackageGroupDialog";
import { EditPackageGroupDialog } from "../components/EditPackageGroupDialog";
import { EditPackageDialog } from "../components/EditPackageDialog";
import { WarehouseDeleteDialog } from "../components/WarehouseDeleteDialog";
import { WarehouseDetailDialog } from "../components/WarehouseDetailDialog";
import { WarehouseFilters } from "../components/WarehouseFilters";
import { exportWarehousePackages } from "@contexts/warehouse/domain/services/exportWarehousePackages";
import { useWarehouseFilters } from "../hooks/useWarehouseFilters";

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
    createPackageGroup,
    isCreatingPackageGroup,
    editPackageGroup,
    isEditingPackageGroup,
    downloadReceipt,
    isDownloadingReceipt,
  } = usePackages({ page, limit });

  const { filters, setFilter, resetFilters, filtered } = useWarehouseFilters(packages);

  const [selected, setSelected] = useState<PackageListViewPrimitives | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<PackageListViewPrimitives | null>(null);
  const [deletePkg, setDeletePkg] = useState<PackageListViewPrimitives | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState<{
    groupId: string;
    status: WarehousePackageStatus;
  } | null>(null);
  const [groupInvoiceMap, setGroupInvoiceMap] = useState<Record<string, string | undefined>>({});

  const handleCreate = async (data: CreatePackageRequest) => {
    await createPackage(data);
    setPage(1);
  };

  const handleUpdate = async (data: UpdatePackageRequest) => {
    if (!editPkg) return;
    await updatePackage(editPkg.id, data);
    setEditPkg(null);
  };

  const handleStatusChange = async (id: string, status: WarehousePackageStatus) => {
    setUpdatingStatusId(id);
    try {
      await updatePackage(id, { status });
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletePkg) return;
    await deletePackage(deletePkg.id);
    setDeletePkg(null);
    setPage(1);
  };

  useEffect(() => {
    setSelectedPackageIds((prev) => {
      const next = prev.filter((id) => packages.some((pkg) => pkg.id === id));
      if (next.length === prev.length) return prev;
      return next;
    });

    // Populate group invoice map from loaded packages
    const newMap: Record<string, string | undefined> = {};
    packages.forEach((pkg) => {
      if (pkg.groupId && pkg.groupInvoiceNumber) {
        newMap[pkg.groupId] = pkg.groupInvoiceNumber;
      }
    });

    setGroupInvoiceMap((prev) => {
      let hasChanges = false;
      for (const key in newMap) {
        if (prev[key] !== newMap[key]) {
          hasChanges = true;
          break;
        }
      }
      return hasChanges ? { ...prev, ...newMap } : prev;
    });
  }, [packages]);

  const selectionAnchor = selectedPackageIds.length > 0
    ? packages.find((pkg) => pkg.id === selectedPackageIds[0])
    : null;

  const isSelectableForGrouping = (pkg: PackageListViewPrimitives) => {
    if (pkg.status !== "WAREHOUSE") return false;
    if (pkg.groupId) return false;
    if (!selectionAnchor) return true;
    return (
      pkg.customer.id === selectionAnchor.customer.id &&
      pkg.store.id === selectionAnchor.store.id
    );
  };

  const handleSelectForGroup = (pkg: PackageListViewPrimitives, checked: boolean) => {
    if (!isSelectableForGrouping(pkg)) return;

    setSelectedPackageIds((prev) => {
      if (checked) {
        if (prev.includes(pkg.id)) return prev;
        return [...prev, pkg.id];
      }
      return prev.filter((id) => id !== pkg.id);
    });
  };

  const handleCreateGroup = async (invoiceNumber?: string) => {
    try {
      const group = await createPackageGroup({ packageIds: selectedPackageIds, invoiceNumber });
      setGroupInvoiceMap((prev) => ({
        ...prev,
        [group.id]: group.invoiceNumber,
      }));
      setCreateGroupOpen(false);
      setSelectedPackageIds([]);
      toast.success("Grupo creado correctamente");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const openEditGroup = (pkg: PackageListViewPrimitives) => {
    if (!pkg.groupId) return;
    setEditGroupTarget({ groupId: pkg.groupId, status: pkg.status });
  };

  const handleEditGroup = async (groupId: string, payload: EditPackageGroupRequest) => {
    try {
      const group = await editPackageGroup(groupId, payload);
      setGroupInvoiceMap((prev) => ({
        ...prev,
        [group.id]: group.invoiceNumber,
      }));
      setEditGroupTarget(null);
      toast.success("Grupo actualizado");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleEditFromDetail = (pkg: PackageListViewPrimitives) => {
    setSelected(null);
    setEditPkg(pkg);
  };

  const handleDeleteFromDetail = (pkg: PackageListViewPrimitives) => {
    setSelected(null);
    setDeletePkg(pkg);
  };

  const groupedPackages = (() => {
    const grouped = new Map<string, PackageListViewPrimitives[]>();

    filtered.forEach((pkg) => {
      const key = pkg.groupId ?? "__ungrouped__";
      const current = grouped.get(key) ?? [];
      current.push(pkg);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries());
  })();

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
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCreateGroupOpen(true)}
            disabled={selectedPackageIds.length < 1 || isCreatingPackageGroup}
          >
            Agrupar paquetes seleccionados ({selectedPackageIds.length})
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Registrar Paquete
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <WarehouseFilters
        filters={filters}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        setFilter={setFilter}
        onLimitChange={(v) => { setLimit(v); setPage(1); }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
        onExport={() => exportWarehousePackages(filtered)}
      />

      {/* ── Table ── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Factura</TableHead>
              <TableHead className="hidden sm:table-cell">Tienda</TableHead>
              <TableHead className="hidden md:table-cell">Proveedor</TableHead>
              <TableHead className="hidden lg:table-cell">Cliente</TableHead>
              <TableHead className="hidden xl:table-cell">Email cliente</TableHead>
              <TableHead className="hidden md:table-cell">Peso</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron paquetes.
                </TableCell>
              </TableRow>
            ) : (
              groupedPackages.map(([groupKey, groupItems]) => {
                const isUngrouped = groupKey === "__ungrouped__";
                const groupStatus = groupItems.every((item) => item.status === groupItems[0].status)
                  ? groupItems[0].status
                  : null;
                const samplePkg = groupItems[0];

                return (
                  <Fragment key={groupKey}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={8}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={isUngrouped ? "secondary" : "outline"} className="font-mono text-xs">
                              {isUngrouped
                                ? "Sin grupo"
                                : groupInvoiceMap[groupKey]
                                  ? groupInvoiceMap[groupKey]
                                  : `Grupo ${groupKey.slice(0, 5)}`
                              }
                            </Badge>
                            <span className="text-muted-foreground">
                              {groupItems.length} paquete{groupItems.length === 1 ? "" : "s"}
                            </span>
                            <span className="text-muted-foreground hidden sm:inline">
                              {samplePkg.customer.name} · {samplePkg.store.name}
                            </span>
                            {groupStatus && (
                              <Badge variant={STATUS_VARIANT[groupStatus]} className="text-xs">
                                {STATUS_LABELS[groupStatus]}
                              </Badge>
                            )}
                          </div>

                          {!isUngrouped && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => openEditGroup(samplePkg)}
                            >
                              Editar grupo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {groupItems.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(p)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {p.status === "WAREHOUSE" && !p.groupId ? (
                            <Checkbox
                              checked={selectedPackageIds.includes(p.id)}
                              onCheckedChange={(value) => handleSelectForGroup(p, value === true)}
                              disabled={!isSelectableForGrouping(p) || isCreatingPackageGroup}
                              aria-label={`Seleccionar paquete ${p.id}`}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{p.officialInvoice || p.id.slice(0, 8)}</span>
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
                        <TableCell className="hidden xl:table-cell text-sm">
                          {p.customer.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {p.weight.value} {p.weight.unit}
                        </TableCell>
                        <TableCell>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={p.status}
                              onValueChange={(v) => handleStatusChange(p.id, v as WarehousePackageStatus)}
                              disabled={updatingStatusId === p.id}
                            >
                              <SelectTrigger className="h-7 w-36 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(STATUS_LABELS) as WarehousePackageStatus[]).map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    <Badge variant={STATUS_VARIANT[s]} className="text-xs">
                                      {STATUS_LABELS[s]}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })
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
        onEditGroup={openEditGroup}
        onDelete={handleDeleteFromDetail}
        onDownloadReceipt={downloadReceipt}
        isDownloadingReceipt={isDownloadingReceipt}
      />
      <CreatePackageGroupDialog
        open={createGroupOpen}
        selectedCount={selectedPackageIds.length}
        isLoading={isCreatingPackageGroup}
        onClose={() => setCreateGroupOpen(false)}
        onConfirm={handleCreateGroup}
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
      <EditPackageGroupDialog
        open={!!editGroupTarget}
        groupId={editGroupTarget?.groupId ?? null}
        initialStatus={editGroupTarget?.status ?? "WAREHOUSE"}
        isLoading={isEditingPackageGroup}
        onClose={() => setEditGroupTarget(null)}
        onSave={handleEditGroup}
      />
    </div>
  );
};

import { STATUS_CONFIG } from "@/contexts/customer-warehouse/ui/components/PackageCard";
import { usePackages } from "@/contexts/warehouse/infrastructure/hooks/usePackages";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
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
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { exportWarehousePackages } from "@contexts/warehouse/domain/services/exportWarehousePackages";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { EditPackageGroupRequest } from "../../domain/PackageGroupSchema";
import type {
  CreatePackageRequest,
  PackageListViewPrimitives,
  UpdatePackageRequest,
  WarehousePackageStatus,
} from "../../domain/WarehousePackageSchema";
import { warehousePackageStatuses } from "../../domain/WarehousePackageSchema";
import { CreatePackageDialog } from "../components/CreatePackageDialog";
import { CreatePackageGroupDialog } from "../components/CreatePackageGroupDialog";
import { EditPackageDialog } from "../components/EditPackageDialog";
import { EditPackageGroupDialog } from "../components/EditPackageGroupDialog";
import { WarehouseDeleteDialog } from "../components/WarehouseDeleteDialog";
import { WarehouseDetailDialog } from "../components/WarehouseDetailDialog";
import { WarehouseFilters } from "../components/WarehouseFilters";
import { usePackageDialog } from "../hooks/usePackageDialog";
import { applyWarehouseFilters, useWarehouseFilters } from "../hooks/useWarehouseFilters";

// ─── Constants ────────────────────────────────────────────────────────────────


const LIMIT_OPTIONS = [10, 20, 50];

// ─── Component ────────────────────────────────────────────────────────────────

export const WarehousePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const { filters, setFilter, resetFilters, criteria } = useWarehouseFilters({
    onSearchChange: () => setPage(1),
  });

  const {
    packages,
    pagination,
    totalPages,
    isLoading,
    isFetching,
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
    printReceipt,
    isPrintingReceipt,
  } = usePackages({ page, limit, search: criteria.search });

  const filtered = useMemo(
    () => applyWarehouseFilters(packages, filters),
    [packages, filters],
  );

  // URL-driven detail dialog (`?packageId=<id>`) so the QR on the printed
  // receipt can deep-link straight into the package details.
  const {
    selectedPackage: selected,
    handleOpenDialog: openDetail,
    handleCloseDialog: closeDetail,
  } = usePackageDialog(packages);
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

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

    // Group invoice numbers are only known after create/edit group API calls;
    // the package list view does not carry them.
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

  const handleCreateGroup = async () => {
    try {
      const group = await createPackageGroup({ packageIds: selectedPackageIds });
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
    closeDetail();
    setEditPkg(pkg);
  };

  const handleDeleteFromDetail = (pkg: PackageListViewPrimitives) => {
    closeDetail();
    setDeletePkg(pkg);
  };

  const groupedPackages = (() => {
    const grouped = new Map<string, PackageListViewPrimitives[]>();

    filtered.forEach((pkg) => {
      const key = pkg.groupId ?? `__ungrouped__:${pkg.customer.id}:${pkg.store.id}`;
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

  const statusCounts = packages.reduce(
    (acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; },
    {} as Partial<Record<WarehousePackageStatus, number>>,
  );

  if (isLoading) {
    return <PageLoader text="Cargando paquetes..." />;
  }

  return (
    <div className={cn("space-y-4 transition-opacity duration-200", isFetching && "opacity-60 pointer-events-none")}>
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
            disabled={selectedPackageIds.length < 2 || isCreatingPackageGroup}
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

      {/* ── Status pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("statusFilter", "all")}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
            filters.statusFilter === "all"
              ? "bg-linear-to-r from-blue-600 to-blue-500 text-white border-transparent hover:scale-105"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50",
          )}
        >
          Todos
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
            filters.statusFilter === "all"
              ? "bg-white/25 backdrop-blur-sm"
              : "bg-slate-200 text-slate-700"
          )}>
            {packages.length}
          </span>
        </button>

        {warehousePackageStatuses.map((status) => {
          const count = statusCounts[status];
          if (!count) return null;
          const config = STATUS_CONFIG[status];
          const isActive = filters.statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter("statusFilter", isActive ? "all" : status)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
                isActive
                  ? cn(config.badgeClass, "hover:scale-105")
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-200",
              )}
            >
              {config.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                isActive
                  ? "bg-white/25 backdrop-blur-sm"
                  : "bg-slate-200 text-slate-700"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

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
              <TableHead className="hidden xl:table-cell">No. Cliente</TableHead>
              <TableHead className="hidden xl:table-cell">Email cliente</TableHead>
              <TableHead className="hidden md:table-cell">Peso</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron paquetes.
                </TableCell>
              </TableRow>
            ) : (
              groupedPackages.map(([groupKey, groupItems]) => {
                const isUngrouped = groupKey.startsWith("__ungrouped__");
                const groupStatus = groupItems.every((item) => item.status === groupItems[0].status)
                  ? groupItems[0].status
                  : null;
                const samplePkg = groupItems[0];
                const isExpanded = isUngrouped || expandedGroups.has(groupKey);

                const groupRowBgClass = groupStatus
                  ? STATUS_CONFIG[groupStatus].rowBgClass
                  : "bg-muted/40 hover:bg-muted/40";

                return (
                  <Fragment key={groupKey}>
                    <TableRow
                      className={cn(
                        groupRowBgClass,
                        !isUngrouped && "cursor-pointer",
                      )}
                      onClick={!isUngrouped ? () => toggleGroup(groupKey) : undefined}
                    >
                      <TableCell colSpan={9}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            {!isUngrouped && (
                              <ChevronDown
                                className={cn(
                                  "size-4 text-muted-foreground transition-transform",
                                  !isExpanded && "-rotate-90",
                                )}
                              />
                            )}
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
                              <Badge
                                variant="outline"
                                className={cn("text-xs", STATUS_CONFIG[groupStatus].badgeClass)}
                              >
                                {STATUS_CONFIG[groupStatus].label}
                              </Badge>
                            )}
                          </div>

                          {!isUngrouped && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={(e) => { e.stopPropagation(); openEditGroup(samplePkg); }}
                            >
                              Editar grupo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && groupItems.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(p)}
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
                        <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">
                          {p.customer.customerNumber != null ? formatCustomerNumber(p.customer.customerNumber) : "—"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm">
                          {p.customer.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {p.boxes.length === 1
                            ? `${p.boxes[0].weight.value} ${p.boxes[0].weight.unit}`
                            : `${p.boxes.length} cajas`}
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
                                {warehousePackageStatuses.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    <span className={cn("font-medium", STATUS_CONFIG[s].textClass)}>
                                      {STATUS_CONFIG[s].label}
                                    </span>
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
        onClose={closeDetail}
        onEdit={handleEditFromDetail}
        onEditGroup={openEditGroup}
        onDelete={handleDeleteFromDetail}
        onDownloadReceipt={downloadReceipt}
        isDownloadingReceipt={isDownloadingReceipt}
        onPrintReceipt={printReceipt}
        isPrintingReceipt={isPrintingReceipt}
      />
      <CreatePackageGroupDialog
        open={createGroupOpen}
        selectedPackages={packages.filter((p) => selectedPackageIds.includes(p.id))}
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

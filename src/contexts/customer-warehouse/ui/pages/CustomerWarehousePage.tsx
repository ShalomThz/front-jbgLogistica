import { useCustomerPackages } from "@/contexts/customer-warehouse/infrastructure/hooks/useCustomerPackages";
import type { EditPackageGroupRequest } from "@/contexts/warehouse/domain/PackageGroupSchema";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { warehousePackageStatuses } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { CreatePackageGroupDialog } from "@/contexts/warehouse/ui/components/CreatePackageGroupDialog";
import { EditPackageGroupDialog } from "@/contexts/warehouse/ui/components/EditPackageGroupDialog";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerPackageDetailDialog } from "../components/CustomerPackageDetailDialog";
import { GroupContainerCard } from "../components/GroupContainerCard";
import { PackageCard, STATUS_CONFIG } from "../components/PackageCard";

const LIMIT_OPTIONS = [10, 20, 50];

export const CustomerWarehousePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    packages,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createPackageGroup,
    isCreatingPackageGroup,
    editPackageGroup,
    isEditingPackageGroup,
  } = useCustomerPackages({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nameSort, setNameSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("desc");
  const [selectionMode, setSelectionMode] = useState(false);

  const [selected, setSelected] = useState<PackageListViewPrimitives | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState<{
    groupId: string;
    status: WarehousePackageStatus;
  } | null>(null);
  const [groupInvoiceMap, setGroupInvoiceMap] = useState<Record<string, string | undefined>>({});

  const handleNameSort = (v: "none" | "asc" | "desc") => {
    setNameSort(v);
    if (v !== "none") setDateSort("none");
  };
  const handleDateSort = (v: "none" | "asc" | "desc") => {
    setDateSort(v);
    if (v !== "none") setNameSort("none");
  };
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setNameSort("none");
    setDateSort("desc");
  };

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (nameSort !== "none" ? 1 : 0) +
    (dateSort !== "none" ? 1 : 0);

  const filtered = (() => {
    const result = packages.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        p.officialInvoice?.toLowerCase().includes(query) ||
        p.provider.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    if (dateSort === "asc")
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc")
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  })();

  const statusCounts = packages.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<WarehousePackageStatus, number>>,
  );

  const selectionAnchor =
    selectedPackageIds.length > 0
      ? packages.find((pkg) => pkg.id === selectedPackageIds[0])
      : null;

  const isSelectableForGrouping = (pkg: PackageListViewPrimitives) => {
    if (pkg.status !== "WAREHOUSE") return false;
    if (pkg.groupId) return false;
    if (!selectionAnchor) return true;
    return pkg.store.id === selectionAnchor.store.id;
  };

  const handleSelectForGroup = (pkg: PackageListViewPrimitives, checked: boolean) => {
    if (!isSelectableForGrouping(pkg)) return;
    setSelectedPackageIds((prev) => {
      if (checked) return prev.includes(pkg.id) ? prev : [...prev, pkg.id];
      return prev.filter((id) => id !== pkg.id);
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPackageIds([]);
  };

  const handleCreateGroup = async (invoiceNumber?: string) => {
    try {
      const group = await createPackageGroup({ packageIds: selectedPackageIds, invoiceNumber });
      setGroupInvoiceMap((prev) => ({ ...prev, [group.id]: group.invoiceNumber }));
      setCreateGroupOpen(false);
      exitSelectionMode();
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
      setGroupInvoiceMap((prev) => ({ ...prev, [group.id]: group.invoiceNumber }));
      setEditGroupTarget(null);
      toast.success("Grupo actualizado");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const grouped = new Map<string, PackageListViewPrimitives[]>();
  filtered.forEach((pkg) => {
    const key = pkg.groupId ?? "__ungrouped__";
    grouped.set(key, [...(grouped.get(key) ?? []), pkg]);
  });

  const ungroupedPackages = grouped.get("__ungrouped__") ?? [];
  const groupEntries = Array.from(grouped.entries()).filter(([key]) => key !== "__ungrouped__");

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + packages.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando paquetes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mis Paquetes</h1>
          <p className="text-sm text-muted-foreground">{total} paquetes registrados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              resetFilters();
              refetch();
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
          {selectionMode ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exitSelectionMode}>
              <X className="size-4" />
              Cancelar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSelectionMode(true)}
            >
              <PackageCheck className="size-4" />
              Seleccionar paquetes
            </Button>
          )}
        </div>
      </div>

      {/* ── Selection mode hint ── */}
      {selectionMode && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          Selecciona paquetes{" "}
          <strong>En bodega</strong> sin grupo. Solo puedes agrupar paquetes de la misma tienda.
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por factura o proveedor..."
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
                {opt} por pagina
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant={activeFilterCount > 0 ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5"
            >
              <Filter className="size-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros y orden</SheetTitle>
              <SheetDescription>
                Filtra y ordena los paquetes por diferentes criterios
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownAZ className="size-3.5" />
                  Ordenar por nombre
                </Label>
                <Select
                  value={nameSort}
                  onValueChange={(v) => handleNameSort(v as "none" | "asc" | "desc")}
                >
                  <SelectTrigger className={nameSort !== "none" ? "ring-2 ring-primary/50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin orden</SelectItem>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  Ordenar por fecha
                </Label>
                <Select
                  value={dateSort}
                  onValueChange={(v) => handleDateSort(v as "none" | "asc" | "desc")}
                >
                  <SelectTrigger className={dateSort !== "none" ? "ring-2 ring-primary/50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin orden</SelectItem>
                    <SelectItem value="desc">Mas reciente</SelectItem>
                    <SelectItem value="asc">Mas antiguo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <hr />
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Filter className="size-3.5" />
                  Estado
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={statusFilter !== "all" ? "ring-2 ring-primary/50" : ""}>
                    <SelectValue />
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
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  resetFilters();
                  refetch();
                }}
              >
                <RefreshCw className="size-4" />
                Limpiar filtros y actualizar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
            statusFilter === "all"
              ? "bg-linear-to-r from-blue-600 to-blue-500 text-white border-transparent hover:scale-105"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50",
          )}
        >
          Todos
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
            statusFilter === "all"
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
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(isActive ? "all" : status)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
                isActive
                  ? cn(
                    config.badgeClass,
                    "hover:scale-105"
                  )
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-200",
              )}
            >
              {config.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                  isActive
                    ? "bg-white/25 backdrop-blur-sm"
                    : "bg-slate-200 text-slate-700"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center rounded-lg border border-dashed">
          <Package className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No se encontraron paquetes.</p>
        </div>
      )}

      {/* ── Group container cards ── */}
      {groupEntries.length > 0 && (
        <div className="space-y-3">
          {groupEntries.map(([groupKey, groupItems]) => (
            <GroupContainerCard
              key={groupKey}
              groupKey={groupKey}
              groupItems={groupItems}
              invoiceLabel={groupInvoiceMap[groupKey]}
              onEditGroup={() => openEditGroup(groupItems[0])}
              onCardClick={setSelected}
            />
          ))}
        </div>
      )}

      {/* ── Ungrouped package cards ── */}
      {ungroupedPackages.length > 0 && (
        <div className="space-y-3">
          {groupEntries.length > 0 && (
            <div className="flex items-center gap-3">
              <hr className="flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Paquetes sin grupo
              </span>
              <hr className="flex-1" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ungroupedPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selectionMode={selectionMode}
                isSelected={selectedPackageIds.includes(pkg.id)}
                isSelectable={isSelectableForGrouping(pkg)}
                onSelect={(checked) => handleSelectForGroup(pkg, checked)}
                onClick={() => setSelected(pkg)}
                isCreatingPackageGroup={isCreatingPackageGroup}
              />
            ))}
          </div>
        </div>
      )}

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
      <CustomerPackageDetailDialog
        pkg={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
      <CreatePackageGroupDialog
        open={createGroupOpen}
        selectedCount={selectedPackageIds.length}
        isLoading={isCreatingPackageGroup}
        onClose={() => setCreateGroupOpen(false)}
        onConfirm={handleCreateGroup}
      />
      <EditPackageGroupDialog
        open={!!editGroupTarget}
        groupId={editGroupTarget?.groupId ?? null}
        initialStatus={editGroupTarget?.status ?? "WAREHOUSE"}
        isLoading={isEditingPackageGroup}
        onClose={() => setEditGroupTarget(null)}
        onSave={handleEditGroup}
      />

      {/* ── Sticky grouping bar (slides up when packages are selected) ── */}
      {selectionMode && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur shadow-lg",
            "transition-transform duration-200 ease-out",
            selectedPackageIds.length > 0 ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-medium">
              {selectedPackageIds.length} paquete
              {selectedPackageIds.length !== 1 ? "s" : ""} seleccionado
              {selectedPackageIds.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPackageIds([])}
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                disabled={isCreatingPackageGroup}
              >
                Agrupar ({selectedPackageIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

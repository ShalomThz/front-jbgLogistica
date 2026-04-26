import { useCustomerPackages } from "@/contexts/customer-warehouse/infrastructure/hooks/useCustomerPackages";
import {
  Badge,
  Button,
  Checkbox,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { ArrowDownAZ, ChevronLeft, ChevronRight, Clock, Filter, RefreshCw, Search } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";
import type { EditPackageGroupRequest } from "@/contexts/warehouse/domain/PackageGroupSchema";
import { CustomerPackageDetailDialog } from "../components/CustomerPackageDetailDialog";
import { CreatePackageGroupDialog } from "@/contexts/warehouse/ui/components/CreatePackageGroupDialog";
import { EditPackageGroupDialog } from "@/contexts/warehouse/ui/components/EditPackageGroupDialog";

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

  const [selected, setSelected] = useState<PackageListViewPrimitives | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState<{
    groupId: string;
    status: WarehousePackageStatus;
  } | null>(null);
  const [groupInvoiceMap, setGroupInvoiceMap] = useState<Record<string, string | undefined>>({});

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
    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  })();

  const selectionAnchor = selectedPackageIds.length > 0
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
      setGroupInvoiceMap((prev) => ({ ...prev, [group.id]: group.invoiceNumber }));
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
      setGroupInvoiceMap((prev) => ({ ...prev, [group.id]: group.invoiceNumber }));
      setEditGroupTarget(null);
      toast.success("Grupo actualizado");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const groupedPackages = (() => {
    const grouped = new Map<string, PackageListViewPrimitives[]>();

    filtered.forEach((pkg) => {
      const key = pkg.groupId ?? "__ungrouped__";
      const current = grouped.get(key) ?? [];
      current.push(pkg);
      grouped.set(key, current);
    });

    // Always render ungrouped (selectable) packages last so the bottom rows have checkboxes.
    // Map preserves insertion order — if a grouped package appears first in the sorted list
    // its key is inserted before "__ungrouped__", pushing selectable rows to the middle.
    const entries = Array.from(grouped.entries());
    const ungroupedIdx = entries.findIndex(([key]) => key === "__ungrouped__");
    if (ungroupedIdx !== -1 && ungroupedIdx !== entries.length - 1) {
      const [ungrouped] = entries.splice(ungroupedIdx, 1);
      entries.push(ungrouped);
    }
    return entries;
  })();

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
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mis Paquetes</h1>
          <p className="text-sm text-muted-foreground">{total} paquetes registrados</p>
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
            Agrupar ({selectedPackageIds.length})
          </Button>
        </div>
      </div>

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
          <SelectTrigger className="w-full sm:w-[130px]">
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
            <Button variant={activeFilterCount > 0 ? "secondary" : "outline"} size="sm" className="gap-1.5">
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
              <SheetDescription>Filtra y ordena los paquetes por diferentes criterios</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownAZ className="size-3.5" />
                  Ordenar por nombre
                </Label>
                <Select value={nameSort} onValueChange={(v) => handleNameSort(v as "none" | "asc" | "desc")}>
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
                <Select value={dateSort} onValueChange={(v) => handleDateSort(v as "none" | "asc" | "desc")}>
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
              <Button variant="outline" className="w-full gap-2" onClick={() => { resetFilters(); refetch(); }}>
                <RefreshCw className="size-4" />
                Limpiar filtros y actualizar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Factura</TableHead>
              <TableHead className="hidden md:table-cell">Proveedor</TableHead>
              <TableHead className="hidden md:table-cell">Peso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
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
              groupedPackages.map(([groupKey, groupItems]) => {
                const isUngrouped = groupKey === "__ungrouped__";
                const groupStatus = groupItems.every((item) => item.status === groupItems[0].status)
                  ? groupItems[0].status
                  : null;
                const samplePkg = groupItems[0];

                return (
                  <Fragment key={groupKey}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={6}>
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
                        <TableCell className="hidden md:table-cell text-sm">
                          {p.provider.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">
                          {p.boxes.length === 1
                            ? `${p.boxes[0].weight.value} ${p.boxes[0].weight.unit}`
                            : `${p.boxes.length} cajas`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[p.status]}>
                            {STATUS_LABELS[p.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
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
    </div>
  );
};

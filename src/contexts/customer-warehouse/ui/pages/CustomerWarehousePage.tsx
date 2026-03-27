import { useCustomerPackages } from "@/contexts/customer-warehouse/infrastructure/hooks/useCustomerPackages";
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
import { ArrowDownAZ, ChevronLeft, ChevronRight, Clock, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { CustomerPackageDetailDialog } from "../components/CustomerPackageDetailDialog";

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

  const { packages, pagination, totalPages, isLoading, refetch } = useCustomerPackages({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nameSort, setNameSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("none");
  const [selected, setSelected] = useState<PackageListViewPrimitives | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Paquetes</h1>
          <p className="text-sm text-muted-foreground">{total} paquetes registrados</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setNameSort("none"); setDateSort("none"); refetch(); }}>
          <RefreshCw className="size-4" />
        </Button>
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
        <Select value={nameSort} onValueChange={(v) => setNameSort(v as "none" | "asc" | "desc")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <ArrowDownAZ className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nombre</SelectItem>
            <SelectItem value="asc">Nombre A-Z</SelectItem>
            <SelectItem value="desc">Nombre Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateSort} onValueChange={(v) => setDateSort(v as "none" | "asc" | "desc")}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Clock className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Creacion</SelectItem>
            <SelectItem value="desc">Mas reciente</SelectItem>
            <SelectItem value="asc">Mas antiguo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                  <TableCell className="hidden md:table-cell text-sm">
                    {p.provider.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">
                    {p.weight.value} {p.weight.unit}
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

      <CustomerPackageDetailDialog
        pkg={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

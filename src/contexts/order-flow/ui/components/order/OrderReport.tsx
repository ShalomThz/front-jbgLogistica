import { useMemo } from "react";
import {
  ArrowDownAZ,
  Box as BoxIcon,
  CalendarDays,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Package,
  RefreshCw,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { exportOrderReport } from "@contexts/order-flow/domain/services/exportOrderReport";
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { orderStatuses } from "@contexts/sales/domain/schemas/order/OrderStatuses";
import { useOrderFilters } from "../../hooks/orders/useOrderFilters";
import type {
  DatePreset,
  DateSort,
  NameSort,
} from "../../hooks/orders/useOrderFilters";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = parseDate(value);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[180px] justify-start text-left font-normal"
          >
            <CalendarDays className="mr-2 size-4 text-muted-foreground" />
            {selected ? (
              selected.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            ) : (
              <span className="text-muted-foreground">Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? formatDate(date) : "")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface Props {
  orders: OrderListView[];
  boxNames: Map<string, string>;
}

export const OrderReport = ({ orders, boxNames }: Props) => {
  const { filters, setFilter, resetFilters, filtered, options } =
    useOrderFilters(orders, { boxNames });

  const reportOrders = useMemo(
    () => filtered.filter((o) => o.status !== "DRAFT"),
    [filtered],
  );
  const reportStatuses = useMemo(
    () => orderStatuses.filter((s) => s !== "DRAFT"),
    [],
  );

  const stats = useMemo(() => {
    const totalOrders = reportOrders.length;
    const paid = reportOrders.filter((o) => o.financials.isPaid);
    const unpaid = reportOrders.filter((o) => !o.financials.isPaid);

    const totalRevenue = reportOrders.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );
    const paidRevenue = paid.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );
    const unpaidRevenue = unpaid.reduce(
      (sum, o) => sum + (o.financials.totalPrice?.amount ?? 0),
      0,
    );

    const byStatus = reportStatuses.reduce(
      (acc, status) => {
        const matching = reportOrders.filter((o) => o.status === status);
        acc[status] = {
          count: matching.length,
          total: matching.reduce(
            (s, o) => s + (o.financials.totalPrice?.amount ?? 0),
            0,
          ),
        };
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );

    const byStore = new Map<
      string,
      {
        name: string;
        count: number;
        total: number;
        paid: number;
        unpaid: number;
      }
    >();
    for (const order of reportOrders) {
      const existing = byStore.get(order.store.id) ?? {
        name: order.store.name,
        count: 0,
        total: 0,
        paid: 0,
        unpaid: 0,
      };
      existing.count++;
      existing.total += order.financials.totalPrice?.amount ?? 0;
      if (order.financials.isPaid) {
        existing.paid += order.financials.totalPrice?.amount ?? 0;
      } else {
        existing.unpaid += order.financials.totalPrice?.amount ?? 0;
      }
      byStore.set(order.store.id, existing);
    }

    return {
      totalOrders,
      totalRevenue,
      paidCount: paid.length,
      paidRevenue,
      unpaidCount: unpaid.length,
      unpaidRevenue,
      byStatus,
      byStore: Array.from(byStore.values()).sort((a, b) => b.total - a.total),
    };
  }, [reportOrders, reportStatuses]);

  const fmt = (amount: number) =>
    `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const activeFilterCount =
    [
      filters.statusFilter,
      filters.storeFilter,
      filters.paymentFilter,
      filters.customerFilter,
      filters.providerFilter,
      filters.boxFilter,
      filters.dateFilter,
    ].filter((v) => v !== "all").length +
    (filters.nameSort !== "none" ? 1 : 0) +
    (filters.dateSort !== "desc" ? 1 : 0);

  const activeRing = (v: string, def = "all") =>
    v !== def ? "ring-2 ring-primary/40" : "";
  const activeSortRing = (v: string) =>
    v !== "none" ? "ring-2 ring-primary/40" : "";

  const paidShare =
    stats.totalOrders > 0
      ? Math.round((stats.paidCount / stats.totalOrders) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="outline" onClick={resetFilters} className="gap-1.5">
          <RefreshCw className="size-4" />
          Limpiar
        </Button>
        <Select
          value={filters.storeFilter}
          onValueChange={(v) => setFilter("storeFilter", v)}
        >
          <SelectTrigger
            className={`w-full sm:w-[200px] ${activeRing(filters.storeFilter)}`}
          >
            <Store className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Tienda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tiendas</SelectItem>
            {options.stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={reportOrders.length === 0}
          onClick={() => exportOrderReport(reportOrders, stats)}
          className="gap-1.5"
        >
          <Download className="size-4" />
          Exportar XLSX
        </Button>
      </div>

      {/* Filters card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-muted-foreground" />
            Filtros
          </CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="font-mono">
              {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "activo" : "activos"}
            </Badge>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Periodo
              </Label>
              <Select
                value={filters.dateFilter}
                onValueChange={(v) => setFilter("dateFilter", v as DatePreset)}
              >
                <SelectTrigger className={activeRing(filters.dateFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Ultima semana</SelectItem>
                  <SelectItem value="month">Ultimo mes</SelectItem>
                  <SelectItem value="3months">Ultimos 3 meses</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.dateFilter === "custom" && (
              <>
                <DatePickerField
                  label="Desde"
                  value={filters.dateFrom}
                  onChange={(v) => setFilter("dateFrom", v)}
                />
                <DatePickerField
                  label="Hasta"
                  value={filters.dateTo}
                  onChange={(v) => setFilter("dateTo", v)}
                />
              </>
            )}

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                Estado
              </Label>
              <Select
                value={filters.statusFilter}
                onValueChange={(v) => setFilter("statusFilter", v)}
              >
                <SelectTrigger className={activeRing(filters.statusFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING_HQ_PROCESS">Pendiente</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5" />
                Pago
              </Label>
              <Select
                value={filters.paymentFilter}
                onValueChange={(v) => setFilter("paymentFilter", v)}
              >
                <SelectTrigger className={activeRing(filters.paymentFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="unpaid">No pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5" />
                Cliente
              </Label>
              <Select
                value={filters.customerFilter}
                onValueChange={(v) => setFilter("customerFilter", v)}
              >
                <SelectTrigger className={activeRing(filters.customerFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {options.customers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="size-3.5" />
                Proveedor
              </Label>
              <Select
                value={filters.providerFilter}
                onValueChange={(v) => setFilter("providerFilter", v)}
              >
                <SelectTrigger className={activeRing(filters.providerFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {options.providers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BoxIcon className="size-3.5" />
                Caja
              </Label>
              <Select
                value={filters.boxFilter}
                onValueChange={(v) => setFilter("boxFilter", v)}
              >
                <SelectTrigger className={activeRing(filters.boxFilter)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cajas</SelectItem>
                  {options.boxes.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      {box.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDownAZ className="size-3.5" />
                Ordenar por nombre
              </Label>
              <Select
                value={filters.nameSort}
                onValueChange={(v) => setFilter("nameSort", v as NameSort)}
              >
                <SelectTrigger className={activeSortRing(filters.nameSort)}>
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
                value={filters.dateSort}
                onValueChange={(v) => setFilter("dateSort", v as DateSort)}
              >
                <SelectTrigger
                  className={
                    filters.dateSort !== "desc" ? "ring-2 ring-primary/40" : ""
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin orden</SelectItem>
                  <SelectItem value="desc">Mas reciente</SelectItem>
                  <SelectItem value="asc">Mas antiguo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ordenes
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1.5">
              <FileText className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {fmt(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagadas
            </CardTitle>
            <div className="rounded-md bg-green-500/10 p-1.5">
              <DollarSign className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.paidCount}
            </div>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {fmt(stats.paidRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Pagadas
            </CardTitle>
            <div className="rounded-md bg-red-500/10 p-1.5">
              <DollarSign className="size-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.unpaidCount}
            </div>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {fmt(stats.unpaidRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Cobro
            </CardTitle>
            <div className="rounded-md bg-indigo-500/10 p-1.5">
              <TrendingUp className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders > 0 ? `${paidShare}%` : "—"}
            </div>
            <Progress value={paidShare} className="mt-2 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.paidCount} de {stats.totalOrders} ordenes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-muted-foreground" />
            Por Estatus
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportStatuses.map((status) => {
              const data = stats.byStatus[status];
              const share =
                stats.totalOrders > 0
                  ? Math.round((data.count / stats.totalOrders) * 100)
                  : 0;
              return (
                <div
                  key={status}
                  className="rounded-lg border bg-card p-3 space-y-2 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={ORDER_STATUS_VARIANT[status as OrderStatus]}
                    >
                      {ORDER_STATUS_LABELS[status as OrderStatus]}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {share}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold tabular-nums">
                      {data.count}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {fmt(data.total)}
                    </p>
                  </div>
                  <Progress value={share} className="h-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By store */}
      {stats.byStore.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4 text-muted-foreground" />
              Por Tienda
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Tienda</TableHead>
                    <TableHead className="text-center">Ordenes</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[140px]">Participacion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byStore.map((store) => {
                    const share =
                      stats.totalRevenue > 0
                        ? Math.round((store.total / stats.totalRevenue) * 100)
                        : 0;
                    return (
                      <TableRow key={store.name}>
                        <TableCell className="font-medium">
                          {store.name}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {store.count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                          {fmt(store.paid)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                          {fmt(store.unpaid)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {fmt(store.total)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={share} className="h-1.5 flex-1" />
                            <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                              {share}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

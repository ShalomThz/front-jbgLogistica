import { StoreFilterCombobox } from "@contexts/iam/ui/components/store/StoreFilterCombobox";
import { EmployeeFilterCombobox } from "@contexts/iam/ui/components/user/EmployeeFilterCombobox";
import { exportOrderReport } from "@contexts/order-flow/domain/services/exportOrderReport";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { useOrderReport } from "@contexts/sales/infrastructure/hooks/orders/useOrderReport";
import {
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Globe,
  MapPin,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  useOrderTableFilters,
  type DatePreset,
} from "../../hooks/orders/useOrderTableFilters";

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
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-45 justify-start text-left font-normal"
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

export const OrderReport = () => {
  const { state: filters, setFilter, reset: resetFilters, criteria } =
    useOrderTableFilters();

  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [currency, setCurrency] = useState<"USD" | "MXN">("USD");

  const reportFilters = [
    ...criteria.filters,
    ...(filters.statusFilter === "all"
      ? [{ field: "status", filterOperator: "!=", value: "DRAFT" } as const]
      : []),
    ...(createdByFilter !== "all"
      ? [{ field: "createdBy.id", filterOperator: "=", value: createdByFilter } as const]
      : []),
    ...(countryFilter !== "all"
      ? [{ field: "destination.address.country", filterOperator: "=", value: countryFilter } as const]
      : []),
  ];

  const { report, isLoading } = useOrderReport({
    filters: reportFilters,
    search: criteria.search,
    currency,
  });

  const fmt = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: report?.currency ?? currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const handleReset = () => {
    resetFilters();
    setCreatedByFilter("all");
    setCountryFilter("all");
    setCurrency("USD");
  };

  const activeFilterCount =
    [filters.statusFilter, filters.storeFilter, filters.dateFilter].filter(
      (v) => v !== "all",
    ).length +
    (createdByFilter !== "all" ? 1 : 0) +
    (countryFilter !== "all" ? 1 : 0) +
    (currency !== "USD" ? 1 : 0);

  const activeRing = (v: string, def = "all") =>
    v !== def ? "ring-2 ring-primary/40 border-primary/40 bg-primary/5" : "";

  const completedCount = report?.byStatus["COMPLETED"] ?? 0;
  const completedShare =
    report && report.totalOrders > 0
      ? Math.round((completedCount / report.totalOrders) * 100)
      : 0;

  const countryOptions = report?.byDestinationCountry ?? [];

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="h-10 gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-4" />
          Limpiar
        </Button>
        <StoreFilterCombobox
          value={filters.storeFilter}
          onChange={(v) => setFilter("storeFilter", v)}
          className="h-10 w-full sm:w-[220px]"
        />
        <Button
          disabled={!report || report.totalOrders === 0}
          onClick={() => report && exportOrderReport(report)}
          className="h-10 gap-2 shadow-sm transition-shadow hover:shadow-md"
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {/* Period */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Periodo
              </Label>
              <Select
                value={filters.dateFilter}
                onValueChange={(v) => setFilter("dateFilter", v as DatePreset)}
              >
                <SelectTrigger
                  className={`h-10 gap-2 transition-colors ${activeRing(filters.dateFilter)}`}
                >
                  <CalendarDays className="size-4 text-muted-foreground" />
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

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Estado
              </Label>
              <Select
                value={filters.statusFilter}
                onValueChange={(v) => setFilter("statusFilter", v)}
              >
                <SelectTrigger
                  className={`h-10 gap-2 transition-colors ${activeRing(filters.statusFilter)}`}
                >
                  <Filter className="size-4 text-muted-foreground" />
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

            {/* Employee (createdBy) */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Empleado
              </Label>
              <EmployeeFilterCombobox
                value={createdByFilter}
                onChange={setCreatedByFilter}
                className={`h-10 ${createdByFilter !== "all" ? "ring-2 ring-primary/40 border-primary/40 bg-primary/5" : ""}`}
              />
            </div>

            {/* Country */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                País destino
              </Label>
              <Select
                value={countryFilter}
                onValueChange={setCountryFilter}
                disabled={countryOptions.length === 0}
              >
                <SelectTrigger
                  className={`h-10 gap-2 transition-colors ${activeRing(countryFilter)}`}
                >
                  <Globe className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Todos los países" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {countryOptions.map((c) => (
                    <SelectItem key={c.country} value={c.country}>
                      {c.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Moneda
              </Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as "USD" | "MXN")}
              >
                <SelectTrigger
                  className={`h-10 gap-2 transition-colors ${activeRing(currency, "USD")}`}
                >
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — Dólar</SelectItem>
                  <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold">
              {isLoading ? "—" : (report?.totalOrders ?? 0)}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {isLoading ? "" : fmt(report?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {isLoading ? "—" : fmt(report?.totalRevenue ?? 0)}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {isLoading ? "" : `Prom. ${fmt(report?.avgOrderValue ?? 0)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Promedio
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isLoading ? "—" : fmt(report?.avgOrderValue ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">por orden</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
            <div className="rounded-md bg-green-500/10 p-1.5">
              <FileText className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? "—" : completedCount}
            </div>
            <Progress value={completedShare} className="mt-2 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {completedShare}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By status */}
      {report && Object.keys(report.byStatus).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-muted-foreground" />
              Por Estatus
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(report.byStatus).map(([status, count]) => {
                const share =
                  report.totalOrders > 0
                    ? Math.round((count / report.totalOrders) * 100)
                    : 0;
                return (
                  <div
                    key={status}
                    className="space-y-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={ORDER_STATUS_VARIANT[status as OrderStatus]}
                      >
                        {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {share}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{count}</p>
                    <Progress value={share} className="h-1" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By store */}
      {report && report.byStore.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4 text-muted-foreground" />
              Por Tienda
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Tienda</TableHead>
                    <TableHead className="text-center">Ordenes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="w-[140px]">Participacion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byStore.map((store) => {
                    const share =
                      report.totalRevenue > 0
                        ? Math.round((store.revenue / report.totalRevenue) * 100)
                        : 0;
                    return (
                      <TableRow key={store.storeId}>
                        <TableCell className="font-medium">
                          {store.storeName}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {store.count}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {fmt(store.revenue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={share} className="h-1.5 flex-1" />
                            <span className="w-8 text-right font-mono text-xs text-muted-foreground">
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

      {/* By destination country */}
      {report && report.byDestinationCountry.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4 text-muted-foreground" />
                Por País de Destino
              </CardTitle>
              {countryFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => setCountryFilter("all")}
                >
                  <X className="size-3" />
                  Limpiar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>País</TableHead>
                    <TableHead className="text-center">Ordenes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="w-[140px]">Participacion</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byDestinationCountry.map((row) => {
                    const isActive = countryFilter === row.country;
                    const share =
                      report.totalOrders > 0
                        ? Math.round((row.count / report.totalOrders) * 100)
                        : 0;
                    return (
                      <TableRow
                        key={row.country}
                        className={isActive ? "bg-primary/5" : undefined}
                      >
                        <TableCell>
                          <Badge
                            variant={isActive ? "default" : "outline"}
                            className="font-mono"
                          >
                            {row.country}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {fmt(row.revenue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={share} className="h-1.5 flex-1" />
                            <span className="w-8 text-right font-mono text-xs text-muted-foreground">
                              {share}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            size="icon"
                            className="size-7"
                            title={isActive ? "Limpiar filtro" : `Filtrar por ${row.country}`}
                            onClick={() =>
                              setCountryFilter(isActive ? "all" : row.country)
                            }
                          >
                            {isActive ? (
                              <X className="size-3.5" />
                            ) : (
                              <Filter className="size-3.5" />
                            )}
                          </Button>
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

      {/* By destination city + by origin client */}
      {report &&
        (report.byDestinationCity.length > 0 ||
          report.byOriginClient.length > 0) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {report.byDestinationCity.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="size-4 text-muted-foreground" />
                    Por Ciudad de Destino
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-center">Ordenes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.byDestinationCity.map((row) => (
                          <TableRow key={`${row.city}-${row.province}`}>
                            <TableCell className="font-medium">
                              {row.city}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {row.province}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {row.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {report.byOriginClient.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4 text-muted-foreground" />
                    Por Cliente de Origen
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-center">Ordenes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.byOriginClient.map((row) => (
                          <TableRow key={row.name}>
                            <TableCell className="font-medium">
                              {row.name}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {row.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

    </div>
  );
};

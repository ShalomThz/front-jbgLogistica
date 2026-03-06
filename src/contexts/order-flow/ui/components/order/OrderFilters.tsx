import { ArrowDownAZ, Box, CalendarDays, Clock, CreditCard, Filter, Package, Search, Store, Truck } from "lucide-react";
import {
  Button,
  Calendar,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import type { OrderFiltersState, OrderFilterOptions, DatePreset, NameSort, DateSort } from "../../hooks/useOrderFilters";

interface OrderFiltersProps {
  filters: OrderFiltersState;
  options: OrderFilterOptions;
  limit: number;
  limitOptions: number[];
  setFilter: <K extends keyof OrderFiltersState>(key: K, value: OrderFiltersState[K]) => void;
  onLimitChange: (value: number) => void;
}

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
            className="w-full justify-start text-left font-normal"
          >
            <CalendarDays className="mr-2 size-4 text-muted-foreground" />
            {selected
              ? selected.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : <span className="text-muted-foreground">Seleccionar fecha</span>}
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

const countActiveFilters = (filters: OrderFiltersState): number =>
  [
    filters.statusFilter,
    filters.storeFilter,
    filters.paymentFilter,
    filters.customerFilter,
    filters.providerFilter,
    filters.boxFilter,
    filters.dateFilter,
  ].filter((v) => v !== "all").length;

export const OrderFilters = ({
  filters,
  options,
  limit,
  limitOptions,
  setFilter,
  onLimitChange,
}: OrderFiltersProps) => {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ID o referencia..."
          value={filters.searchQuery}
          onChange={(e) => setFilter("searchQuery", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={String(limit)}
        onValueChange={(v) => onLimitChange(Number(v))}
      >
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {limitOptions.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {opt} por página
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.nameSort}
        onValueChange={(v) => {
          setFilter("nameSort", v as NameSort);
        }}
      >
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

      <Select
        value={filters.dateSort}
        onValueChange={(v) => {
          setFilter("dateSort", v as DateSort);
        }}
      >
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

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant={activeCount > 0 ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <Filter className="size-4" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Filtra las órdenes por diferentes criterios</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                Estado
              </Label>
              <Select value={filters.statusFilter} onValueChange={(v) => setFilter("statusFilter", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PENDING_HQ_PROCESS">Pendiente</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Store className="size-3.5" />
                Tienda
              </Label>
              <Select value={filters.storeFilter} onValueChange={(v) => setFilter("storeFilter", v)}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5" />
                Pago
              </Label>
              <Select value={filters.paymentFilter} onValueChange={(v) => setFilter("paymentFilter", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="unpaid">No pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5" />
                Cliente
              </Label>
              <Select value={filters.customerFilter} onValueChange={(v) => setFilter("customerFilter", v)}>
                <SelectTrigger>
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
              <Select value={filters.providerFilter} onValueChange={(v) => setFilter("providerFilter", v)}>
                <SelectTrigger>
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
                <Box className="size-3.5" />
                Caja
              </Label>
              <Select value={filters.boxFilter} onValueChange={(v) => setFilter("boxFilter", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cajas</SelectItem>
                  {options.boxes.map((boxId) => (
                    <SelectItem key={boxId} value={boxId}>
                      {boxId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Fecha
              </Label>
              <Select value={filters.dateFilter} onValueChange={(v) => setFilter("dateFilter", v as DatePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.dateFilter === "custom" && (
              <div className="space-y-3">
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
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

import {
  ArrowDownAZ,
  Box,
  CalendarDays,
  Clock,
  CreditCard,
  Filter,
  Hash,
  MapPin,
  RefreshCw,
  Search,
  Store,
  UserRound,
} from "lucide-react";
import { useState } from "react";
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
import type {
  OrderTableFilterState,
  DatePreset,
  NameSort,
  DateSort,
} from "../../hooks/orders/useOrderTableFilters";
import { StoreFilterCombobox } from "@contexts/iam/ui/components/store/StoreFilterCombobox";
import { BoxFilterCombobox } from "@contexts/inventory/ui/components/box/BoxFilterCombobox";
import { CustomerFilterCombobox } from "@contexts/sales/ui/components/customer/CustomerFilterCombobox";

interface OrderFiltersProps {
  filters: OrderTableFilterState;
  limit: number;
  limitOptions: number[];
  /** El filtro de tienda solo tiene sentido con CAN_LIST_ALL_ORDERS: sin ese
   * permiso la consulta ya viene acotada a la tienda del usuario. */
  showStoreFilter: boolean;
  setFilter: <K extends keyof OrderTableFilterState>(
    key: K,
    value: OrderTableFilterState[K],
  ) => void;
  onLimitChange: (value: number) => void;
  onResetAndRefetch: () => void;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? undefined : date;
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = parseDate(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-11 w-full justify-start rounded-xl bg-background text-left font-normal shadow-xs"
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

const countAdvancedFilters = (
  filters: OrderTableFilterState,
  showStoreFilter: boolean,
): number =>
  [
    filters.statusFilter,
    showStoreFilter ? filters.storeFilter : "all",
    filters.paymentFilter,
    filters.boxFilter,
  ].filter((value) => value !== "all").length +
  (filters.nameSort !== "none" || filters.dateSort !== "desc" ? 1 : 0);

const hasActiveFilters = (
  filters: OrderTableFilterState,
  showStoreFilter: boolean,
) =>
  filters.searchQuery.trim().length > 0 ||
  filters.originCustomerFilter !== "all" ||
  filters.destinationCustomerFilter !== "all" ||
  filters.dateFilter !== "all" ||
  countAdvancedFilters(filters, showStoreFilter) > 0;

const activeSelectClass = (value: string, defaultValue = "all") =>
  value !== defaultValue ? "border-primary/40 bg-primary/5" : "";

const activeSortClass = (value: string, defaultValue: string) =>
  value !== defaultValue ? "ring-2 ring-primary/50" : "";

function FilterFieldLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/75">
      <Icon className="size-3.5 text-primary" />
      {children}
    </Label>
  );
}

export const OrderFilters = ({
  filters,
  limit,
  limitOptions,
  showStoreFilter,
  setFilter,
  onLimitChange,
  onResetAndRefetch,
}: OrderFiltersProps) => {
  const advancedCount = countAdvancedFilters(filters, showStoreFilter);
  const filtersAreActive = hasActiveFilters(filters, showStoreFilter);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section
      aria-label="Búsqueda y filtros de órdenes"
      className="rounded-2xl border bg-card/80 p-3 shadow-sm sm:p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.35fr)_minmax(210px,1fr)_minmax(210px,1fr)_minmax(180px,0.8fr)]">
        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <FilterFieldLabel icon={Hash}>Orden o número de guía</FilterFieldLabel>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Buscar por número de orden o número de guía"
              placeholder="Ej. JBG-1024 o 1Z999AA..."
              value={filters.searchQuery}
              onChange={(event) => setFilter("searchQuery", event.target.value)}
              className="h-11 rounded-xl bg-background pl-9 shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FilterFieldLabel icon={UserRound}>Remitente</FilterFieldLabel>
          <CustomerFilterCombobox
            value={filters.originCustomerFilter}
            onChange={(value) => setFilter("originCustomerFilter", value)}
            allLabel="Todos los remitentes"
            searchPlaceholder="Buscar remitente..."
          />
        </div>

        <div className="space-y-1.5">
          <FilterFieldLabel icon={MapPin}>Destinatario</FilterFieldLabel>
          <CustomerFilterCombobox
            value={filters.destinationCustomerFilter}
            onChange={(value) => setFilter("destinationCustomerFilter", value)}
            allLabel="Todos los destinatarios"
            searchPlaceholder="Buscar destinatario..."
          />
        </div>

        <div className="space-y-1.5">
          <FilterFieldLabel icon={CalendarDays}>Fecha de creación</FilterFieldLabel>
          <Select
            value={filters.dateFilter}
            onValueChange={(value) => setFilter("dateFilter", value as DatePreset)}
          >
            <SelectTrigger
              className={`h-11 w-full rounded-xl bg-background shadow-xs ${activeSelectClass(filters.dateFilter)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier fecha</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Últimos 7 días</SelectItem>
              <SelectItem value="month">Últimos 30 días</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filters.dateFilter === "custom" && (
        <div className="mt-3 grid gap-3 rounded-xl border border-dashed bg-muted/30 p-3 sm:grid-cols-2 xl:ml-auto xl:max-w-[520px]">
          <DatePickerField
            label="Desde"
            value={filters.dateFrom}
            onChange={(value) => setFilter("dateFrom", value)}
          />
          <DatePickerField
            label="Hasta"
            value={filters.dateTo}
            onChange={(value) => setFilter("dateTo", value)}
          />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {filtersAreActive
            ? "La lista se actualiza automáticamente con tus filtros."
            : "Busca una orden o combina clientes y fecha para acotar resultados."}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {filtersAreActive && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onResetAndRefetch}
            >
              <RefreshCw className="size-3.5" />
              Limpiar
            </Button>
          )}

          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger
              aria-label="Resultados por página"
              className="h-9 w-[142px] rounded-lg"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant={advancedCount > 0 ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 rounded-lg"
              >
                <Filter className="size-4" />
                Más filtros
                {advancedCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {advancedCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Más filtros</SheetTitle>
                <SheetDescription>
                  Ajusta el estado, pago, tienda, caja y orden de la lista.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Ordenar por fecha
                  </Label>
                  <Select
                    value={filters.dateSort}
                    onValueChange={(value) => setFilter("dateSort", value as DateSort)}
                  >
                    <SelectTrigger className={activeSortClass(filters.dateSort, "desc")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Más reciente</SelectItem>
                      <SelectItem value="asc">Más antiguo</SelectItem>
                      <SelectItem value="none">Sin orden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowDownAZ className="size-3.5" />
                    Ordenar por destinatario
                  </Label>
                  <Select
                    value={filters.nameSort}
                    onValueChange={(value) => setFilter("nameSort", value as NameSort)}
                  >
                    <SelectTrigger className={activeSortClass(filters.nameSort, "none")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin orden</SelectItem>
                      <SelectItem value="asc">A-Z</SelectItem>
                      <SelectItem value="desc">Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <hr />

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Filter className="size-3.5" />
                    Estado
                  </Label>
                  <Select
                    value={filters.statusFilter}
                    onValueChange={(value) => setFilter("statusFilter", value)}
                  >
                    <SelectTrigger className={activeSelectClass(filters.statusFilter)}>
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

                {showStoreFilter && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Store className="size-3.5" />
                      Tienda
                    </Label>
                    <StoreFilterCombobox
                      value={filters.storeFilter}
                      onChange={(value) => setFilter("storeFilter", value)}
                      enabled={sheetOpen}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    Pago
                  </Label>
                  <Select
                    value={filters.paymentFilter}
                    onValueChange={(value) => setFilter("paymentFilter", value)}
                  >
                    <SelectTrigger className={activeSelectClass(filters.paymentFilter)}>
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
                    <Box className="size-3.5" />
                    Caja
                  </Label>
                  <BoxFilterCombobox
                    value={filters.boxFilter}
                    onChange={(value) => setFilter("boxFilter", value)}
                    enabled={sheetOpen}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    onResetAndRefetch();
                    setSheetOpen(false);
                  }}
                >
                  <RefreshCw className="size-4" />
                  Limpiar filtros y actualizar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
};

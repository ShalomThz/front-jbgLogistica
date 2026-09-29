import { StoreFilterCombobox } from "@contexts/iam/ui/components/store/StoreFilterCombobox";
import { BoxFilterCombobox } from "@contexts/inventory/ui/components/box/BoxFilterCombobox";
import { ORDER_STATUS_OPTIONS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { CustomerFilterCombobox } from "@contexts/sales/ui/components/customer/CustomerFilterCombobox";
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
import {
  ArrowDownAZ,
  Box,
  CalendarDays,
  Clock,
  CreditCard,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Store,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type {
  DatePreset,
  DateSort,
  NameSort,
  OrderTableFilterState,
} from "../../hooks/orders/useOrderTableFilters";

interface OrderFiltersProps {
  filters: OrderTableFilterState;
  limit: number;
  limitOptions: number[];
  /** El filtro de tienda solo tiene sentido con CAN_LIST_ALL_ORDERS: sin ese
   * permiso la consulta ya viene acotada a la tienda del usuario. */
  showStoreFilter: boolean;
  /** El menú de columnas de la tabla, para que los tres controles de la vista
   * queden juntos. Lo arma la página, que es la que tiene ese estado. */
  columnsMenu?: ReactNode;
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
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start rounded-lg bg-background text-left font-normal"
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

/** Etiqueta de un campo dentro del panel. */
function SheetFieldLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Search;
  children: ReactNode;
}) {
  return (
    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </Label>
  );
}

/**
 * Cuántos filtros hay puestos dentro del panel, que ahora es *todos* menos el
 * buscador. Es el número del badge: sin él, con el panel cerrado alguien ve la
 * tabla acotada y no encuentra por qué.
 */
const countSheetFilters = (
  filters: OrderTableFilterState,
  showStoreFilter: boolean,
): number =>
  [
    filters.originCustomerFilter,
    filters.destinationCustomerFilter,
    filters.dateFilter,
    filters.statusFilter,
    showStoreFilter ? filters.storeFilter : "all",
    filters.paymentFilter,
    filters.boxFilter,
  ].filter((value) => value !== "all").length +
  (filters.nameSort !== "none" || filters.dateSort !== "desc" ? 1 : 0);

const activeSelectClass = (value: string, defaultValue = "all") =>
  value !== defaultValue ? "border-primary/40 bg-primary/5" : "";

const activeSortClass = (value: string, defaultValue: string) =>
  value !== defaultValue ? "ring-2 ring-primary/50" : "";

/**
 * Barra de herramientas de la tabla de órdenes.
 *
 * Solo el buscador por número queda a la vista; todo lo demás vive en el panel
 * lateral. Antes había una card con cuatro campos siempre desplegados arriba de
 * la tabla, que ocupaba la franja más valiosa de la pantalla para filtros que
 * casi nunca se cambian dos veces seguidas.
 */
export const OrderFilters = ({
  filters,
  limit,
  limitOptions,
  showStoreFilter,
  columnsMenu,
  setFilter,
  onLimitChange,
  onResetAndRefetch,
}: OrderFiltersProps) => {
  const sheetCount = countSheetFilters(filters, showStoreFilter);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar por número de orden o número de guía"
          placeholder="Buscar orden o número de guía..."
          value={filters.searchQuery}
          onChange={(event) => setFilter("searchQuery", event.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={String(limit)}
        onValueChange={(value) => onLimitChange(Number(value))}
      >
        <SelectTrigger
          aria-label="Resultados por página"
          className="h-9 w-[142px]"
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
            variant={sheetCount > 0 ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
          >
            <Filter className="size-4" />
            Más filtros
            {sheetCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {sheetCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Más filtros</SheetTitle>
            <SheetDescription>
              Acota la lista por cliente, fecha, estado, pago, tienda o caja, y
              elige cómo ordenarla.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            <div className="space-y-1.5">
              <SheetFieldLabel icon={UserRound}>Remitente</SheetFieldLabel>
              <CustomerFilterCombobox
                value={filters.originCustomerFilter}
                onChange={(value) => setFilter("originCustomerFilter", value)}
                allLabel="Todos los remitentes"
                searchPlaceholder="Buscar remitente..."
                enabled={sheetOpen}
              />
            </div>

            <div className="space-y-1.5">
              <SheetFieldLabel icon={MapPin}>Destinatario</SheetFieldLabel>
              <CustomerFilterCombobox
                value={filters.destinationCustomerFilter}
                onChange={(value) =>
                  setFilter("destinationCustomerFilter", value)
                }
                allLabel="Todos los destinatarios"
                searchPlaceholder="Buscar destinatario..."
                enabled={sheetOpen}
              />
            </div>

            <div className="space-y-1.5">
              <SheetFieldLabel icon={CalendarDays}>
                Fecha de creación
              </SheetFieldLabel>
              <Select
                value={filters.dateFilter}
                onValueChange={(value) =>
                  setFilter("dateFilter", value as DatePreset)
                }
              >
                <SelectTrigger className={activeSelectClass(filters.dateFilter)}>
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

            {filters.dateFilter === "custom" && (
              <div className="grid gap-3 rounded-lg border border-dashed bg-muted/30 p-3">
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

            <div className="space-y-1.5">
              <SheetFieldLabel icon={Filter}>Estado</SheetFieldLabel>
              <Select
                value={filters.statusFilter}
                onValueChange={(value) => setFilter("statusFilter", value)}
              >
                <SelectTrigger
                  className={activeSelectClass(filters.statusFilter)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ORDER_STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <SheetFieldLabel icon={CreditCard}>Pago</SheetFieldLabel>
              <Select
                value={filters.paymentFilter}
                onValueChange={(value) => setFilter("paymentFilter", value)}
              >
                <SelectTrigger
                  className={activeSelectClass(filters.paymentFilter)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="unpaid">No pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showStoreFilter && (
              <div className="space-y-1.5">
                <SheetFieldLabel icon={Store}>Tienda</SheetFieldLabel>
                <StoreFilterCombobox
                  value={filters.storeFilter}
                  onChange={(value) => setFilter("storeFilter", value)}
                  enabled={sheetOpen}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <SheetFieldLabel icon={Box}>Caja</SheetFieldLabel>
              <BoxFilterCombobox
                value={filters.boxFilter}
                onChange={(value) => setFilter("boxFilter", value)}
                enabled={sheetOpen}
              />
            </div>

            <hr />

            <div className="space-y-1.5">
              <SheetFieldLabel icon={Clock}>Ordenar por fecha</SheetFieldLabel>
              <Select
                value={filters.dateSort}
                onValueChange={(value) =>
                  setFilter("dateSort", value as DateSort)
                }
              >
                <SelectTrigger
                  className={activeSortClass(filters.dateSort, "desc")}
                >
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
              <SheetFieldLabel icon={ArrowDownAZ}>
                Ordenar por destinatario
              </SheetFieldLabel>
              <Select
                value={filters.nameSort}
                onValueChange={(value) =>
                  setFilter("nameSort", value as NameSort)
                }
              >
                <SelectTrigger
                  className={activeSortClass(filters.nameSort, "none")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin orden</SelectItem>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
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

      {columnsMenu}
    </div>
  );
};

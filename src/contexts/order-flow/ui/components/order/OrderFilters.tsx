import { Search } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import type { OrderFiltersState, OrderFilterOptions, DatePreset } from "../../hooks/useOrderFilters";

interface OrderFiltersProps {
  filters: OrderFiltersState;
  options: OrderFilterOptions;
  limit: number;
  limitOptions: number[];
  setFilter: <K extends keyof OrderFiltersState>(key: K, value: OrderFiltersState[K]) => void;
  onLimitChange: (value: number) => void;
}

export const OrderFilters = ({
  filters,
  options,
  limit,
  limitOptions,
  setFilter,
  onLimitChange,
}: OrderFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Row 1: Search + Status + Items per page */}
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
        <Select value={filters.statusFilter} onValueChange={(v) => setFilter("statusFilter", v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PENDING_HQ_PROCESS">Pendiente</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      {/* Row 2: Type + Store + Payment + Customer + Provider + Box + Date */}
      <div className="flex flex-wrap gap-3">
<Select value={filters.storeFilter} onValueChange={(v) => setFilter("storeFilter", v)}>
          <SelectTrigger className="w-full sm:w-[170px]">
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

        <Select value={filters.paymentFilter} onValueChange={(v) => setFilter("paymentFilter", v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pagos</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="unpaid">No pagado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.customerFilter} onValueChange={(v) => setFilter("customerFilter", v)}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Cliente" />
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

        <Select value={filters.providerFilter} onValueChange={(v) => setFilter("providerFilter", v)}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Proveedor" />
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

        <Select value={filters.boxFilter} onValueChange={(v) => setFilter("boxFilter", v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Caja" />
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

        <Select value={filters.dateFilter} onValueChange={(v) => setFilter("dateFilter", v as DatePreset)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Fecha" />
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

      {/* Row 3: Custom date range inputs */}
      {filters.dateFilter === "custom" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Desde:</span>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="w-full sm:w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="w-full sm:w-[180px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

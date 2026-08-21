import {
  ArrowDownAZ,
  Clock,
  Download,
  Eraser,
  Filter,
  Globe,
  Map,
  RefreshCw,
  Search,
} from "lucide-react";
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
import type { ZoneFiltersState, NameSort, DateSort } from "../../hooks/useZoneFilters";

export interface ZoneFilterOptions {
  /** Países presentes en el catálogo, con su nombre para mostrar. */
  countries: { code: string; name: string }[];
  /** Estados del país elegido (todos, si no hay país elegido). */
  states: string[];
}

interface ZoneFiltersProps {
  filters: ZoneFiltersState;
  options: ZoneFilterOptions;
  limit: number;
  limitOptions: number[];
  setFilter: <K extends keyof ZoneFiltersState>(key: K, value: ZoneFiltersState[K]) => void;
  onLimitChange: (value: number) => void;
  onResetAndRefetch: () => void;
  onExport?: () => void;
}

const countActiveFilters = (filters: ZoneFiltersState): number =>
  (filters.nameSort !== "none" ? 1 : 0) + (filters.dateSort !== "none" ? 1 : 0);

const ALL = "__all__";

const activeSortClass = (value: string) =>
  value !== "none" ? "ring-2 ring-primary/50" : "";

export const ZoneFilters = ({
  filters,
  options,
  limit,
  limitOptions,
  setFilter,
  onLimitChange,
  onResetAndRefetch,
  onExport,
}: ZoneFiltersProps) => {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o descripcion..."
          value={filters.searchQuery}
          onChange={(e) => setFilter("searchQuery", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.country || ALL}
        onValueChange={(v) => setFilter("country", v === ALL ? "" : v)}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <span className="flex items-center gap-1.5 truncate">
            <Globe className="size-3.5 shrink-0" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los países</SelectItem>
          {options.countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.state || ALL}
        onValueChange={(v) => setFilter("state", v === ALL ? "" : v)}
        disabled={options.states.length === 0}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <span className="flex items-center gap-1.5 truncate">
            <Map className="size-3.5 shrink-0" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {options.states.map((st) => (
            <SelectItem key={st} value={st}>
              {st}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(filters.country || filters.state) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Limpiar país y estado"
          onClick={() => {
            setFilter("country", "");
            setFilter("state", "");
          }}
        >
          <Eraser className="size-4" />
        </Button>
      )}

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
              {opt} por pagina
            </SelectItem>
          ))}
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
            <SheetTitle>Filtros y orden</SheetTitle>
            <SheetDescription>Filtra y ordena las zonas por diferentes criterios</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDownAZ className="size-3.5" />
                Ordenar por nombre
              </Label>
              <Select
                value={filters.nameSort}
                onValueChange={(v) => setFilter("nameSort", v as NameSort)}
              >
                <SelectTrigger className={activeSortClass(filters.nameSort)}>
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
                <SelectTrigger className={activeSortClass(filters.dateSort)}>
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

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onResetAndRefetch}
            >
              <RefreshCw className="size-4" />
              Limpiar filtros y actualizar
            </Button>
            {onExport && (
              <Button variant="outline" className="w-full gap-2" onClick={onExport}>
                <Download className="size-4" />
                Exportar XLSX
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

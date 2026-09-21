import { useMemo, useState, type UIEvent } from "react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { useInfiniteZones } from "@contexts/pricing/infrastructure/hooks/zones/useInfiniteZones";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

interface ZoneSelectorProps {
  /** Zona efectiva para la cotización (override o la de la tienda). */
  zoneId: string | undefined;
  onZoneChange: (zoneId: string) => void;
  disabled?: boolean;
  /** Oculta la etiqueta cuando el contenedor ya la pone. */
  hideLabel?: boolean;
  label?: string;
  className?: string;
}

function zoneLocation(zone: Pick<ZonePrimitives, "state" | "country">): string {
  return [zone.state, zone.country].filter(Boolean).join(", ");
}

/**
 * Elige la zona con la que se cotiza. Busca contra el servidor y pagina al
 * scrollear: el catálogo crece con cada estado que se divide, así que traerlo
 * entero dejó de ser viable.
 *
 * Muestra estado y país junto al nombre porque los nombres se repiten entre
 * estados — "Zona Centro" existe en Nuevo León y en Jalisco.
 */
export function ZoneSelector({
  zoneId,
  onZoneChange,
  disabled,
  hideLabel = false,
  label = "Zona de tarifas",
  className,
}: ZoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { zones, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteZones({
      search: debouncedSearch.trim() || undefined,
      limit: 10,
      enabled: open,
    });

  // La zona seleccionada puede no estar en la página cargada (o el popover
  // nunca se abrió), así que se busca aparte para poder mostrar su nombre.
  const selectedFilters = useMemo(
    () => (zoneId ? [{ field: "id", filterOperator: "=" as const, value: zoneId }] : []),
    [zoneId],
  );
  const { zones: selectedLookup } = useZones({
    filters: selectedFilters,
    enabled: !!zoneId,
  });

  const selected = zones.find((z) => z.id === zoneId) ?? selectedLookup[0];

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      void fetchNextPage();
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {!hideLabel && (
        <Label htmlFor="zone-select" className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="zone-select"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate">{selected.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {zoneLocation(selected)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Selecciona una zona</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por zona o estado..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList onScroll={handleScroll}>
              {isLoading && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!isLoading && <CommandEmpty>No se encontraron zonas.</CommandEmpty>}
              <CommandGroup>
                {zones.map((zone) => (
                  <CommandItem
                    key={zone.id}
                    value={zone.id}
                    onSelect={() => {
                      onZoneChange(zone.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        zoneId === zone.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{zone.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {zoneLocation(zone)}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {isFetchingNextPage && (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  Cargando más...
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

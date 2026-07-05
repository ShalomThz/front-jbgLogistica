import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { Box as BoxIcon, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useInfiniteBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useInfiniteBoxes";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

interface BoxPickerComboboxProps {
  value: string | undefined;
  onChange: (box: BoxPrimitives) => void;
  id?: string;
  error?: boolean;
  placeholder?: string;
  className?: string;
  triggerLabel?: (box: BoxPrimitives) => React.ReactNode;
  itemLabel?: (box: BoxPrimitives) => React.ReactNode;
  /**
   * When provided, the picker lists exactly these boxes (filtered client-side by
   * name) instead of the global catalog. Used to scope stores to the boxes with a
   * tariff in their zone. Omit for the full paginated catalog.
   */
  source?: { boxes: BoxPrimitives[]; isLoading: boolean };
}

const defaultTriggerLabel = (b: BoxPrimitives) => (
  <span className="flex items-center gap-2 truncate">
    <BoxIcon className="size-4 shrink-0" />
    <span className="truncate">{b.name}</span>
  </span>
);

const defaultItemLabel = (b: BoxPrimitives) => (
  <div className="flex-1 min-w-0">
    <div className="font-medium truncate">{b.name}</div>
    <div className="text-xs text-muted-foreground">
      {b.dimensions.length}×{b.dimensions.width}×{b.dimensions.height} {b.dimensions.unit} · stock {b.stock}
    </div>
  </div>
);

export function BoxPickerCombobox({
  value,
  onChange,
  id,
  error,
  placeholder = "Seleccionar caja",
  className,
  triggerLabel = defaultTriggerLabel,
  itemLabel = defaultItemLabel,
  source,
}: BoxPickerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    boxes: catalogBoxes,
    isLoading: isCatalogLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBoxes({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    // El catálogo global solo se consulta cuando no hay una fuente acotada.
    enabled: open && !source,
  });

  const selectedFilters = useMemo(
    () =>
      value
        ? [{ field: "id", filterOperator: "=" as const, value }]
        : [],
    [value],
  );

  const { boxes: selectedLookup } = useBoxes({
    filters: selectedFilters,
    enabled: !!value && !source,
  });

  // Con fuente acotada filtramos por nombre en cliente (lista chica); si no,
  // usamos el catálogo paginado del servidor.
  const boxes = useMemo(() => {
    if (!source) return catalogBoxes;
    const q = debouncedSearch.trim().toLowerCase();
    return q
      ? source.boxes.filter((b) => b.name.toLowerCase().includes(q))
      : source.boxes;
  }, [source, catalogBoxes, debouncedSearch]);

  const isLoading = source ? source.isLoading : isCatalogLoading;

  const selectedBox =
    (source ? source.boxes : catalogBoxes).find((b) => b.id === value) ??
    selectedLookup[0];

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (source || !hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value && selectedBox ? (
            triggerLabel(selectedBox)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar caja..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList onScroll={handleScroll}>
            {isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!isLoading && (
              <CommandEmpty>No se encontraron cajas.</CommandEmpty>
            )}
            <CommandGroup>
              {boxes.map((box) => (
                <CommandItem
                  key={box.id}
                  value={box.id}
                  onSelect={() => {
                    onChange(box);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === box.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {itemLabel(box)}
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
  );
}

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
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useInfiniteBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useInfiniteBoxes";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

interface BoxFilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
  className?: string;
}

const ALL = "all";

export function BoxFilterCombobox({
  value,
  onChange,
  enabled = true,
  className,
}: BoxFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    boxes,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBoxes({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    enabled: enabled && open,
  });

  const selectedFilters = useMemo(
    () =>
      value !== ALL
        ? [{ field: "id", filterOperator: "=" as const, value }]
        : [],
    [value],
  );

  const { boxes: selectedLookup } = useBoxes({
    filters: selectedFilters,
    enabled: enabled && value !== ALL,
  });

  const selectedName =
    value === ALL
      ? null
      : boxes.find((b) => b.id === value)?.name ?? selectedLookup[0]?.name;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            value !== ALL && "ring-2 ring-primary/50",
            className,
          )}
        >
          {value === ALL ? (
            "Todas las cajas"
          ) : selectedName ? (
            selectedName
          ) : (
            <span className="text-muted-foreground">Caja seleccionada</span>
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
              <CommandItem
                value={ALL}
                onSelect={() => {
                  onChange(ALL);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    value === ALL ? "opacity-100" : "opacity-0",
                  )}
                />
                Todas las cajas
              </CommandItem>
              {boxes.map((box) => (
                <CommandItem
                  key={box.id}
                  value={box.id}
                  onSelect={() => {
                    onChange(box.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === box.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {box.name}
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

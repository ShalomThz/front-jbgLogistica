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
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useInfiniteStores } from "@contexts/iam/infrastructure/hooks/stores/useInfiniteStores";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";

interface StorePickerComboboxProps {
  value: string | undefined;
  onChange: (store: StoreListViewPrimitives) => void;
  id?: string;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

export function StorePickerCombobox({
  value,
  onChange,
  id,
  error,
  placeholder = "Seleccionar tienda",
  className,
}: StorePickerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    stores,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteStores({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    enabled: open,
  });

  const selectedFilters = useMemo(
    () =>
      value
        ? [{ field: "id", filterOperator: "=" as const, value }]
        : [],
    [value],
  );

  const { stores: selectedLookup } = useStores({
    filters: selectedFilters,
    enabled: !!value,
  });

  const selectedName =
    stores.find((s) => s.id === value)?.name ?? selectedLookup[0]?.name;

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
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value && selectedName ? (
            <span className="flex items-center gap-2">
              <Store className="size-4" />
              {selectedName}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar tienda..."
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
              <CommandEmpty>No se encontraron tiendas.</CommandEmpty>
            )}
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.id}
                  onSelect={() => {
                    onChange(store);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === store.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <Store className="size-4" />
                    {store.name}
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
  );
}

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
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { useInfiniteCustomers } from "@contexts/sales/infrastructure/hooks/customers/useInfiniteCustomers";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";

interface CustomerFilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  searchPlaceholder?: string;
  enabled?: boolean;
  className?: string;
}

const ALL = "all";

export function CustomerFilterCombobox({
  value,
  onChange,
  allLabel,
  searchPlaceholder = "Buscar cliente...",
  enabled = true,
  className,
}: CustomerFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    customers,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCustomers({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    enabled: enabled && open,
    order: { field: "name", direction: "ASC" },
  });

  const selectedFilters = useMemo(
    () =>
      value !== ALL
        ? [{ field: "id", filterOperator: "=" as const, value }]
        : [],
    [value],
  );

  const { customers: selectedLookup } = useCustomers({
    filters: selectedFilters,
    enabled: enabled && value !== ALL,
  });

  const selectedCustomer =
    value === ALL
      ? undefined
      : customers.find((customer) => customer.id === value) ?? selectedLookup[0];
  const isWaitingForSearch = search.trim() !== debouncedSearch.trim();
  const isSearching =
    isWaitingForSearch || isLoading || (isFetching && !isFetchingNextPage);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between rounded-xl bg-background px-3 font-normal shadow-xs",
            value !== ALL && "border-primary/40 bg-primary/5 text-foreground",
            className,
          )}
        >
          <span className="truncate">
            {value === ALL ? (
              <span className="text-muted-foreground">{allLabel}</span>
            ) : selectedCustomer ? (
              selectedCustomer.name
            ) : (
              <span className="text-muted-foreground">Cliente seleccionado</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList onScroll={handleScroll}>
            {isSearching && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando clientes...
              </div>
            )}
            {!isSearching && (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}
            <CommandGroup>
              <CommandItem
                value={ALL}
                onSelect={() => {
                  onChange(ALL);
                  setSearch("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    value === ALL ? "opacity-100" : "opacity-0",
                  )}
                />
                {allLabel}
              </CommandItem>
              {!isSearching && customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onChange(customer.id);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === customer.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCustomerNumber(customer.customerNumber)} · {customer.phone}
                    </p>
                  </div>
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

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
import { Check, ChevronsUpDown, User } from "lucide-react";
import { useMemo, useState, type UIEvent } from "react";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useInfiniteCustomers } from "@contexts/sales/infrastructure/hooks/customers/useInfiniteCustomers";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";

interface CustomerPickerComboboxProps {
  value: string | undefined;
  onChange: (customer: CustomerListViewPrimitives) => void;
  id?: string;
  error?: boolean;
  placeholder?: string;
  className?: string;
  triggerLabel?: (customer: CustomerListViewPrimitives) => React.ReactNode;
  itemLabel?: (customer: CustomerListViewPrimitives) => React.ReactNode;
}

const defaultTriggerLabel = (c: CustomerListViewPrimitives) => (
  <span className="flex items-center gap-2 truncate">
    <User className="size-4 shrink-0" />
    <span className="truncate">{c.name}</span>
  </span>
);

const defaultItemLabel = (c: CustomerListViewPrimitives) => (
  <div className="flex-1 min-w-0">
    <div className="font-medium truncate">{c.name}</div>
    <div className="text-xs text-muted-foreground">
      {c.phone} · {c.address.city}
    </div>
  </div>
);

export function CustomerPickerCombobox({
  value,
  onChange,
  id,
  error,
  placeholder = "Seleccionar cliente",
  className,
  triggerLabel = defaultTriggerLabel,
  itemLabel = defaultItemLabel,
}: CustomerPickerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    customers,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCustomers({
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

  const { customers: selectedLookup } = useCustomers({
    filters: selectedFilters,
    enabled: !!value,
  });

  const selectedCustomer =
    customers.find((c) => c.id === value) ?? selectedLookup[0];

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
          {value && selectedCustomer ? (
            triggerLabel(selectedCustomer)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente..."
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
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onChange(customer);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === customer.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {itemLabel(customer)}
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

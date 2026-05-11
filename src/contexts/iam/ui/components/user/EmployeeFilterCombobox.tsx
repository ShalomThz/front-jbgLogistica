import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

interface EmployeeFilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
  className?: string;
}

const ALL = "all";

export function EmployeeFilterCombobox({
  value,
  onChange,
  enabled = true,
  className,
}: EmployeeFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { users, isLoading } = useUsers({
    search: debouncedSearch.trim() || undefined,
    limit: 20,
    enabled: enabled && open,
  });

  const selectedFilters = useMemo(
    () =>
      value !== ALL
        ? [{ field: "id", filterOperator: "=" as const, value }]
        : [],
    [value],
  );

  const { users: selectedLookup } = useUsers({
    filters: selectedFilters,
    enabled: enabled && value !== ALL,
  });

  const selectedName =
    value === ALL
      ? null
      : users.find((u) => u.id === value)?.name ?? selectedLookup[0]?.name;

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
            "Todos los empleados"
          ) : selectedName ? (
            selectedName
          ) : (
            <span className="text-muted-foreground">Empleado seleccionado</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar empleado..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!isLoading && (
              <CommandEmpty>No se encontraron empleados.</CommandEmpty>
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
                Todos los empleados
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === user.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

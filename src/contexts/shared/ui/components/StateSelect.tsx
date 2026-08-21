import {
  Button,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  MIN_STATE_QUERY_LENGTH,
  useStates,
} from "@contexts/shared/infrastructure/hooks/useStates";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import { Check, ChevronsUpDown, PenLine } from "lucide-react";
import { useState } from "react";

interface StateSelectProps {
  value?: string;
  onChange: (state: string) => void;
  /** Código ISO del país. Sin él no hay nada que buscar. */
  country?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Busca la división de primer nivel del país elegido contra el catálogo del
 * servidor, en vez de dejar el estado como texto libre: escrito a mano, el
 * mismo estado entra como "Nuevo Leon", "N.L." y "nuevo león", y después las
 * zonas no agrupan.
 *
 * Queda una salida manual igual, porque el catálogo puede no traer una
 * división que el negocio sí usa.
 */
export function StateSelect({
  value,
  onChange,
  country,
  placeholder = "Seleccionar estado",
  disabled = false,
  className,
  id,
}: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { states, isLoading } = useStates({
    country,
    query: debouncedSearch,
    enabled: open,
  });

  const trimmed = search.trim();
  const searchable = trimmed.length >= MIN_STATE_QUERY_LENGTH;
  const hasExactMatch = states.some(
    (state) => state.name.toLowerCase() === trimmed.toLowerCase(),
  );

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setSearch("");
  };

  return (
    // `modal`: igual que en CountrySelect, adentro de un Dialog el bloqueo de
    // scroll cancela la rueda sobre el popover, que vive en otro portal.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !country}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="truncate text-muted-foreground">
              {country ? placeholder : "Elige un país primero"}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar estado..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!searchable && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Escribe al menos {MIN_STATE_QUERY_LENGTH} letras
              </div>
            )}
            {searchable && isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {searchable && !isLoading && (
              <CommandGroup>
                {states.map((state) => (
                  <CommandItem
                    key={state.name}
                    value={state.name}
                    onSelect={() => select(state.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        value === state.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {state.name}
                  </CommandItem>
                ))}
                {!hasExactMatch && (
                  <CommandItem
                    value={`__manual__${trimmed}`}
                    onSelect={() => select(trimmed)}
                  >
                    <PenLine className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      Usar &laquo;{trimmed}&raquo;
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

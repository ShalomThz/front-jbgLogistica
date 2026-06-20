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
import { Check, ChevronsUpDown, RefreshCw } from "lucide-react";
import { useState, type UIEvent } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  useInfiniteSkydropxConsignmentNotes,
  useSkydropxConsignmentNoteByCode,
} from "@contexts/order-flow/infrastructure/hooks/skydropx/pro/useSkydropxPro";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function ProductTypeSelector() {
  const { setValue, formState: { errors } } = useFormContext<HQOrderFormValues>();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const consignmentNoteClassCode = useWatch<HQOrderFormValues, "package.consignmentNoteClassCode">({
    name: "package.consignmentNoteClassCode",
  });

  const {
    consignmentNotes,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSkydropxConsignmentNotes({
    search: debouncedSearch.trim() || undefined,
    enabled: open,
  });

  const selectedLookup = useSkydropxConsignmentNoteByCode(
    consignmentNoteClassCode || undefined,
  );
  const selected =
    consignmentNotes.find((n) => n.consignment_note === consignmentNoteClassCode) ??
    selectedLookup;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-muted-foreground">
          Tipo de producto
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-7 gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Busca y selecciona la clasificación de carta porte (SAT) de tu producto
      </p>

      <div>
        <Label>Carta porte *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={!!errors.package?.consignmentNoteClassCode}
              className="w-full justify-between font-normal"
            >
              {selected ? (
                <span className="truncate">{selected.description} - {selected.consignment_note}</span>
              ) : (
                <span className="text-muted-foreground">Buscar carta porte...</span>
              )}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por código o descripción..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList onScroll={handleScroll}>
                {isLoading && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Buscando...
                  </div>
                )}
                {!isLoading && <CommandEmpty>Sin resultados.</CommandEmpty>}
                <CommandGroup>
                  {consignmentNotes.map((note) => (
                    <CommandItem
                      key={note.consignment_note}
                      value={note.consignment_note}
                      onSelect={() => {
                        setValue("package.consignmentNoteClassCode", note.consignment_note, { shouldValidate: true });
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 size-4", consignmentNoteClassCode === note.consignment_note ? "opacity-100" : "opacity-0")} />
                      <div>
                        <div className="font-medium">{note.description}</div>
                        <div className="text-xs text-muted-foreground">{note.consignment_note}</div>
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
        {errors.package?.consignmentNoteClassCode && (
          <p className="text-sm text-destructive">{errors.package.consignmentNoteClassCode.message}</p>
        )}
      </div>
    </div>
  );
}

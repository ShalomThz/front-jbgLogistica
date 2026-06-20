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
  useInfiniteSkydropxPackagings,
  useSkydropxPackagingByCode,
} from "@contexts/order-flow/infrastructure/hooks/skydropx/pro/useSkydropxPro";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function PackagingSelector() {
  const { setValue, formState: { errors } } = useFormContext<HQOrderFormValues>();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const consignmentNotePackagingCode = useWatch<HQOrderFormValues, "package.consignmentNotePackagingCode">({
    name: "package.consignmentNotePackagingCode",
  });

  const {
    packagings,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSkydropxPackagings({
    search: debouncedSearch.trim() || undefined,
    enabled: open,
  });

  const selectedLookup = useSkydropxPackagingByCode(
    consignmentNotePackagingCode || undefined,
  );
  const selected =
    packagings.find((p) => p.code === consignmentNotePackagingCode) ??
    selectedLookup;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2">
      <Label>Empaque *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!errors.package?.consignmentNotePackagingCode}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="truncate">{selected.name} - {selected.code}</span>
            ) : (
              <span className="text-muted-foreground">Buscar empaque...</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por código o nombre..."
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
                {packagings.map((pkg) => (
                  <CommandItem
                    key={pkg.code}
                    value={pkg.code}
                    onSelect={() => {
                      setValue("package.consignmentNotePackagingCode", pkg.code, { shouldValidate: true });
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", consignmentNotePackagingCode === pkg.code ? "opacity-100" : "opacity-0")} />
                    <div>
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground">{pkg.code}</div>
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
      {errors.package?.consignmentNotePackagingCode && (
        <p className="text-sm text-destructive">{errors.package.consignmentNotePackagingCode.message}</p>
      )}
      </div>
      <div className="flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}

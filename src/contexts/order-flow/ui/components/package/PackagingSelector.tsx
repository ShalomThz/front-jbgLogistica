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
import { Check, ChevronsUpDown, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useSkydropxPackagings } from "@/contexts/order-flow/infrastructure/hooks/useSkydropx";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const accentInsensitiveFilter = (value: string, search: string) =>
  normalize(value).includes(normalize(search)) ? 1 : 0;

export function PackagingSelector() {
  const { setValue, formState: { errors } } = useFormContext<NewOrderFormValues>();
  const [open, setOpen] = useState(false);

  const consignmentNotePackagingCode = useWatch<NewOrderFormValues, "package.consignmentNotePackagingCode">({
    name: "package.consignmentNotePackagingCode",
  });

  const { packagings, isLoading, refetch } = useSkydropxPackagings();
  const selected = packagings.find((p) => p.attributes.code === consignmentNotePackagingCode);

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
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Cargando...
              </span>
            ) : selected ? (
              <span className="truncate">{selected.attributes.name} - {selected.attributes.code}</span>
            ) : (
              <span className="text-muted-foreground">Buscar empaque...</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command filter={accentInsensitiveFilter}>
            <CommandInput placeholder="Buscar por código o nombre..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {packagings.map((pkg) => (
                  <CommandItem
                    key={pkg.id}
                    value={`${pkg.attributes.code} ${pkg.attributes.name}`}
                    onSelect={() => {
                      setValue("package.consignmentNotePackagingCode", pkg.attributes.code, { shouldValidate: true });
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", consignmentNotePackagingCode === pkg.attributes.code ? "opacity-100" : "opacity-0")} />
                    <div>
                      <div className="font-medium">{pkg.attributes.name}</div>
                      <div className="text-xs text-muted-foreground">{pkg.attributes.code}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
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
